'use strict';

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const ticketTypes = require('../../config/ticketTypes');
const config = require('../../config/config');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('إنشاء لوحة التذاكر / Create the ticket panel')
    .setDefaultMemberPermissions(0x8), // Administrator

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: '❌ هذا الأمر للمديرين فقط. / Admins only.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎫 نظام التذاكر — Vyro Management System')
      .setDescription(
        '**مرحباً بك في نظام الدعم الخاص بنا!**\n' +
        'Welcome to our support system!\n\n' +
        '📌 لفتح تذكرة، اختر النوع المناسب من القائمة أدناه.\n' +
        '📌 To open a ticket, select the appropriate type from the menu below.\n\n' +
        '**📋 أنواع التذاكر المتاحة / Available Ticket Types:**\n' +
        ticketTypes.map(t => `${t.emoji} **${t.nameAr}** / ${t.nameEn}\n> ${t.descriptionAr}`).join('\n\n')
      )
      .setFooter({ text: 'Vyro Management System • نظام إدارة Vyro' })
      .setTimestamp();

    const options = ticketTypes.map(t => ({
      label: `${t.nameAr} / ${t.nameEn}`,
      description: t.descriptionAr,
      value: t.id,
      emoji: t.emoji,
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_type_select')
      .setPlaceholder('اختر نوع التذكرة / Select ticket type')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ تم إنشاء لوحة التذاكر! / Ticket panel created!', ephemeral: true });
  },
};
