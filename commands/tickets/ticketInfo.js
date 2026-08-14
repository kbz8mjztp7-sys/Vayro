'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { getTicketByChannel, getTicketType, getParticipants } = require('../../services/ticketService');
const { baseEmbed } = require('../../utils/embeds');
const { STATUS_LABELS, PRIORITY_LABELS } = require('../../utils/constants');
const { formatTimestamp } = require('../../utils/sanitizers');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-info')
    .setDescription('معلومات تفصيلية عن التذكرة / Detailed ticket information'),

  async execute(interaction) {
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const ticketType = getTicketType(ticket.ticket_type);
    const participants = await getParticipants(ticket.id);

    const embed = baseEmbed(config.colors.primary)
      .setTitle(`🎫 معلومات التذكرة #${ticket.id} / Ticket Info #${ticket.id}`)
      .addFields(
        { name: '👤 المُرسِل / Creator', value: `<@${ticket.creator_id}>`, inline: true },
        { name: '📂 النوع / Type', value: ticketType ? `${ticketType.emoji} ${ticketType.nameAr} / ${ticketType.nameEn}` : ticket.ticket_type, inline: true },
        { name: '📋 الحالة / Status', value: STATUS_LABELS[ticket.status] || ticket.status, inline: true },
        { name: '📌 الموضوع / Subject', value: ticket.subject || 'غير محدد', inline: false },
        { name: '📝 الوصف / Description', value: (ticket.description || 'غير محدد').substring(0, 500), inline: false },
        { name: '🔖 الأولوية / Priority', value: PRIORITY_LABELS[ticket.priority] || ticket.priority, inline: true },
        { name: '👮 مُستلَم بواسطة / Claimed By', value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : 'لم يُستلَم / Unclaimed', inline: true },
        { name: '📢 القناة / Channel', value: `<#${ticket.channel_id}> (${ticket.channel_id})`, inline: true },
        { name: '🕐 تاريخ الإنشاء / Created', value: formatTimestamp(ticket.created_at), inline: true },
        { name: '🔒 تاريخ الإغلاق / Closed', value: ticket.closed_at ? formatTimestamp(ticket.closed_at) : 'لم يُغلق / Not closed', inline: true },
        { name: '👥 المشاركون / Participants', value: participants.length > 0 ? participants.map(id => `<@${id}>`).join(', ') : 'لا يوجد / None', inline: false },
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
