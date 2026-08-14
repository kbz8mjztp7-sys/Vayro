'use strict';

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getTicketByChannel } = require('../../services/ticketService');
const { isManagement } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('حذف التذكرة نهائياً / Permanently delete the ticket'),

  async execute(interaction) {
    if (!isManagement(interaction.member)) {
      return interaction.reply({ content: '❌ الإدارة فقط. / Management only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_delete_confirm').setLabel('🗑️ حذف / Delete').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_delete_cancel').setLabel('❌ إلغاء / Cancel').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      content: `⚠️ **تحذير:** سيتم حذف التذكرة #${ticket.id} نهائياً بعد إنشاء نسخة منها.\n**Warning:** Ticket #${ticket.id} will be permanently deleted after transcript generation.`,
      components: [row],
      ephemeral: true,
    });
  },
};
