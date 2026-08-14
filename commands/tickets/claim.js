'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getTicketByChannel, getTicketType, claimTicket, updateTicketField } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport } = require('../../utils/permissions');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../../components/buttons/ticketButtons');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('استلام التذكرة / Claim the current ticket'),

  async execute(interaction) {
    if (!isSupport(interaction.member)) {
      return interaction.reply({ content: '❌ الموظفون فقط يمكنهم استلام التذاكر. / Staff only.', ephemeral: true });
    }

    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ هذا الأمر يُستخدم داخل قناة تذكرة فقط. / Use inside a ticket channel.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
      const updated = await claimTicket(ticket.id, interaction.member.id, interaction.client);

      // Update channel permissions: hide from general support role, keep for claimer
      const channel = interaction.channel;
      if (config.roles.support) {
        await channel.permissionOverwrites.edit(config.roles.support, { ViewChannel: false }).catch(() => {});
      }
      await channel.permissionOverwrites.edit(interaction.member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      }).catch(() => {});

      // Update opening message embed
      const ticketType = getTicketType(ticket.ticket_type);
      if (ticket.opening_message_id) {
        const msg = await channel.messages.fetch(ticket.opening_message_id).catch(() => null);
        if (msg) {
          const embed = ticketEmbed(updated, ticketType);
          await msg.edit({ embeds: [embed], components: buildTicketActionRows() }).catch(() => {});
        }
      }

      await logTicketAction('تم استلام التذكرة / Ticket Claimed', {
        ticketId: ticket.id, performer: interaction.member.id, channel: channel.id,
      });

      await interaction.editReply({ content: `✅ استلمت التذكرة #${ticket.id} بنجاح. / Successfully claimed ticket #${ticket.id}.` });
      await channel.send(`✅ <@${interaction.member.id}> استلم هذه التذكرة. / has claimed this ticket.`);
    } catch (err) {
      if (err.type === 'ALREADY_CLAIMED') {
        return interaction.editReply({ content: `❌ هذه التذكرة مُستلمة بالفعل من <@${err.claimedBy}>. / Already claimed by <@${err.claimedBy}>.` });
      }
      throw err;
    }
  },
};
