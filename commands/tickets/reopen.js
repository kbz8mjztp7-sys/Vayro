'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getTicketByChannel, getTicketType, reopenTicket } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport } = require('../../utils/permissions');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../../components/buttons/ticketButtons');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reopen')
    .setDescription('إعادة فتح التذكرة / Reopen the ticket'),

  async execute(interaction) {
    if (!isSupport(interaction.member)) {
      return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });
    if (ticket.status !== 'closed') return interaction.reply({ content: '❌ التذكرة ليست مغلقة. / Ticket is not closed.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const updated = await reopenTicket(ticket.id, interaction.member.id);
    const channel = interaction.channel;

    // Restore creator permissions
    await channel.permissionOverwrites.edit(ticket.creator_id, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
    }).catch(() => {});

    // Move back to original category
    const origCategory = ticket.category_id || config.channels.ticketCategory;
    if (origCategory) await channel.setParent(origCategory, { lockPermissions: false }).catch(() => {});

    const ticketType = getTicketType(ticket.ticket_type);
    if (ticket.opening_message_id) {
      const msg = await channel.messages.fetch(ticket.opening_message_id).catch(() => null);
      if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
    }

    await logTicketAction('إعادة فتح التذكرة / Ticket Reopened', {
      ticketId: ticket.id, performer: interaction.member.id, channel: channel.id,
    });

    await interaction.editReply({ content: `✅ تمت إعادة فتح التذكرة #${ticket.id}. / Ticket #${ticket.id} reopened.` });
    await channel.send(`🔓 <@${interaction.member.id}> أعاد فتح التذكرة. / reopened the ticket.`);
  },
};
