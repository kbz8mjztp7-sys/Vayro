'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { getTicketByChannel, getTicketType } = require('../../services/ticketService');
const { generateTranscript, sendTranscript } = require('../../services/transcriptService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('إنشاء نسخة من محادثة التذكرة / Generate ticket transcript'),

  async execute(interaction) {
    if (!isSupport(interaction.member)) {
      return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const ticketType = getTicketType(ticket.ticket_type);
    const typeName = ticketType ? `${ticketType.nameAr} / ${ticketType.nameEn}` : ticket.ticket_type;

    const { attachment, filename, messageCount } = await generateTranscript(interaction.channel, ticket, typeName);
    await sendTranscript(interaction.client, ticket, attachment, filename);

    await logTicketAction('تم إنشاء نسخة / Transcript Generated', {
      ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id,
      details: { 'الرسائل / Messages': String(messageCount) },
    });

    await interaction.editReply({
      content: `✅ تم إنشاء نسخة التذكرة #${ticket.id} (${messageCount} رسالة). / Transcript generated for ticket #${ticket.id} (${messageCount} messages).`,
      files: [attachment],
    });
  },
};
