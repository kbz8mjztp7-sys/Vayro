'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getTicketByChannel, getTicketType, updateTicketField } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport, isAdmin } = require('../../utils/permissions');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../../components/buttons/ticketButtons');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('تحويل التذكرة لموظف آخر / Transfer ticket to another staff')
    .addUserOption(opt => opt.setName('staff').setDescription('الموظف الجديد / New staff').setRequired(true)),

  async execute(interaction) {
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const isClaimant = ticket.claimed_by === interaction.member.id;
    if (!isClaimant && !isAdmin(interaction.member)) {
      return interaction.reply({ content: '❌ فقط الموظف المُستلِم أو المدير. / Only claimer or admin.', ephemeral: true });
    }

    const newStaff = interaction.options.getMember('staff');
    if (!newStaff) return interaction.reply({ content: '❌ العضو غير موجود في السيرفر. / Member not in server.', ephemeral: true });
    if (newStaff.id === interaction.member.id) return interaction.reply({ content: '❌ لا يمكنك التحويل لنفسك. / Cannot transfer to yourself.', ephemeral: true });
    if (!isSupport(newStaff)) return interaction.reply({ content: '❌ يجب أن يكون العضو المحدد موظفاً. / Target must be staff.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const prevClaimer = ticket.claimed_by;
    await updateTicketField(ticket.id, 'claimed_by', newStaff.id);
    await updateTicketField(ticket.id, 'transferred_to', newStaff.id);
    await updateTicketField(ticket.id, 'status', 'claimed');

    const channel = interaction.channel;
    // Remove old staff permission if safe
    if (prevClaimer && prevClaimer !== newStaff.id) {
      await channel.permissionOverwrites.delete(prevClaimer).catch(() => {});
    }
    // Add new staff permission
    await channel.permissionOverwrites.edit(newStaff.id, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
    }).catch(() => {});
    // Keep support role hidden (claimed)
    if (config.roles.support) {
      await channel.permissionOverwrites.edit(config.roles.support, { ViewChannel: false }).catch(() => {});
    }

    const updated = await getTicketByChannel(channel.id);
    const ticketType = getTicketType(ticket.ticket_type);
    if (ticket.opening_message_id) {
      const msg = await channel.messages.fetch(ticket.opening_message_id).catch(() => null);
      if (msg && updated) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
    }

    await logTicketAction('تم تحويل التذكرة / Ticket Transferred', {
      ticketId: ticket.id, performer: interaction.member.id, target: newStaff.id, channel: channel.id,
    });

    await interaction.editReply({ content: `✅ تم تحويل التذكرة إلى <@${newStaff.id}>. / Transferred to <@${newStaff.id}>.` });
    await channel.send(`🔄 <@${interaction.member.id}> حوّل التذكرة إلى <@${newStaff.id}>. / transferred ticket to <@${newStaff.id}>.`);
  },
};
