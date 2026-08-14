'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { getTicketByChannel, getTicketType, updateTicketField } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isManagement } = require('../../utils/permissions');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../../components/buttons/ticketButtons');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review-end')
    .setDescription('إنهاء المراجعة وإعادة التذكرة / End review and return ticket'),

  async execute(interaction) {
    if (!isManagement(interaction.member)) {
      return interaction.reply({ content: '❌ الإدارة فقط. / Management only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const newStatus = ticket.claimed_by ? 'claimed' : 'open';
    const updated = await updateTicketField(ticket.id, 'status', newStatus);

    const channel = interaction.channel;
    // Return to original category
    const origCategory = ticket.category_id || config.channels.ticketCategory;
    if (origCategory) await channel.setParent(origCategory, { lockPermissions: false }).catch(() => {});

    const ticketType = getTicketType(ticket.ticket_type);
    if (ticket.opening_message_id) {
      const msg = await channel.messages.fetch(ticket.opening_message_id).catch(() => null);
      if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
    }

    await logTicketAction('إنهاء المراجعة / Review Ended', { ticketId: ticket.id, performer: interaction.member.id, channel: channel.id });
    await interaction.editReply({ content: `✅ انتهت المراجعة للتذكرة #${ticket.id}. / Review ended for ticket #${ticket.id}.` });
    await channel.send(`✅ <@${interaction.member.id}> أنهى المراجعة وأعاد التذكرة. / ended review and returned the ticket.`);
  },
};
