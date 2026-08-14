'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getTicketByChannel, getTicketType, unclaimTicket } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isAdmin, isManagement } = require('../../utils/permissions');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../../components/buttons/ticketButtons');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unclaim')
    .setDescription('إلغاء استلام التذكرة / Unclaim the current ticket'),

  async execute(interaction) {
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket channel.', ephemeral: true });

    const isClaimant = ticket.claimed_by === interaction.member.id;
    if (!isClaimant && !isAdmin(interaction.member)) {
      return interaction.reply({ content: '❌ فقط الموظف المُستلِم أو المدير يمكنه إلغاء الاستلام. / Only the claimer or admin.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const updated = await unclaimTicket(ticket.id, interaction.member.id);

    // Restore support role access
    const channel = interaction.channel;
    if (config.roles.support) {
      await channel.permissionOverwrites.edit(config.roles.support, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
      }).catch(() => {});
    }
    // Remove specific staff overwrite if safe
    if (ticket.claimed_by) {
      const staffMember = channel.guild.members.cache.get(ticket.claimed_by);
      if (staffMember && !isAdmin(staffMember) && !isManagement(staffMember)) {
        await channel.permissionOverwrites.delete(ticket.claimed_by).catch(() => {});
      }
    }

    const ticketType = getTicketType(ticket.ticket_type);
    if (ticket.opening_message_id) {
      const msg = await channel.messages.fetch(ticket.opening_message_id).catch(() => null);
      if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
    }

    await logTicketAction('إلغاء استلام التذكرة / Ticket Unclaimed', {
      ticketId: ticket.id, performer: interaction.member.id, channel: channel.id,
    });

    await interaction.editReply({ content: `✅ تم إلغاء استلام التذكرة #${ticket.id}. / Unclaimed ticket #${ticket.id}.` });
    await channel.send(`↩️ <@${interaction.member.id}> أعاد التذكرة للطابور. / returned ticket to queue.`);
  },
};
