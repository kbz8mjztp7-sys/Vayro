'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getTicketByChannel, getTicketType, updateTicketField } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport, isManagement } = require('../../utils/permissions');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../../components/buttons/ticketButtons');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('تحويل التذكرة للمراجعة / Send ticket to review'),

  async execute(interaction) {
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket channel.', ephemeral: true });

    const isClaimant = ticket.claimed_by === interaction.member.id;
    if (!isClaimant && !isManagement(interaction.member)) {
      return interaction.reply({ content: '❌ فقط الموظف المُستلِم أو الإدارة. / Only the claimer or management.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const updated = await updateTicketField(ticket.id, 'status', 'review');

    const channel = interaction.channel;
    if (config.channels.reviewTicketCategory) {
      await channel.setParent(config.channels.reviewTicketCategory, { lockPermissions: false }).catch(() => {});
    }

    const ticketType = getTicketType(ticket.ticket_type);
    if (ticket.opening_message_id) {
      const msg = await channel.messages.fetch(ticket.opening_message_id).catch(() => null);
      if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
    }

    await logTicketAction('تذكرة قيد المراجعة / Ticket Under Review', {
      ticketId: ticket.id, performer: interaction.member.id, channel: channel.id,
    });

    await interaction.editReply({ content: `✅ تم تحويل التذكرة #${ticket.id} للمراجعة. / Ticket #${ticket.id} sent to review.` });
    await channel.send(`🔍 <@${interaction.member.id}> أرسل هذه التذكرة للمراجعة. / sent this ticket for review.`);
  },
};
