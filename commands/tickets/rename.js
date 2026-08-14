'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { getTicketByChannel } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport } = require('../../utils/permissions');
const { sanitizeChannelName } = require('../../utils/sanitizers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('إعادة تسمية قناة التذكرة / Rename the ticket channel')
    .addStringOption(opt => opt.setName('name').setDescription('الاسم الجديد / New name').setRequired(true).setMaxLength(90)),

  async execute(interaction) {
    if (!isSupport(interaction.member)) {
      return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const rawName = interaction.options.getString('name');
    const newName = sanitizeChannelName(rawName).substring(0, 100);
    if (!newName) return interaction.reply({ content: '❌ الاسم غير صالح. / Invalid name.', ephemeral: true });

    const oldName = interaction.channel.name;
    await interaction.deferReply({ ephemeral: true });

    await interaction.channel.setName(newName);

    await logTicketAction('إعادة تسمية التذكرة / Ticket Renamed', {
      ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id,
      details: { 'الاسم القديم / Old Name': oldName, 'الاسم الجديد / New Name': newName },
    });

    await interaction.editReply({ content: `✅ تم إعادة التسمية إلى \`${newName}\`. / Renamed to \`${newName}\`.` });
  },
};
