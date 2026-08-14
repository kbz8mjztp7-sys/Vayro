'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { query } = require('../../database/database');
const { isAdmin } = require('../../utils/permissions');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('عرض إعدادات السيرفر الحالية / View current server settings')
    .setDefaultMemberPermissions(0x8),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });

    const result = await query(`SELECT * FROM server_settings WHERE guild_id=$1`, [interaction.guild.id]);
    const s = result.rows[0];

    const embed = baseEmbed(config.colors.primary)
      .setTitle(`⚙️ إعدادات السيرفر / Server Settings — ${interaction.guild.name}`)
      .addFields(
        { name: '🎫 نظام التذاكر / Ticket System', value: [
          `فئة التذاكر: ${config.channels.ticketCategory ? `<#${config.channels.ticketCategory}>` : 'غير محدد'}`,
          `فئة المغلقة: ${config.channels.closedTicketCategory ? `<#${config.channels.closedTicketCategory}>` : 'غير محدد'}`,
          `قناة السجلات: ${config.channels.log ? `<#${config.channels.log}>` : 'غير محدد'}`,
          `قناة النسخ: ${config.channels.transcript ? `<#${config.channels.transcript}>` : 'غير محدد'}`,
        ].join('\n'), inline: false },
        { name: '👋 الترحيب / Welcome', value: s ? [
          `مُفعَّل: ${s.welcome_enabled ? '✅' : '❌'}`,
          `القناة: ${s.welcome_channel_id ? `<#${s.welcome_channel_id}>` : 'غير محدد'}`,
        ].join('\n') : 'غير مُعدَّ / Not configured', inline: true },
        { name: '👋 الوداع / Goodbye', value: s ? [
          `مُفعَّل: ${s.goodbye_enabled ? '✅' : '❌'}`,
          `القناة: ${s.goodbye_channel_id ? `<#${s.goodbye_channel_id}>` : 'غير محدد'}`,
        ].join('\n') : 'غير مُعدَّ / Not configured', inline: true },
        { name: '🎭 الأدوار / Roles', value: [
          `الإدارة: ${config.roles.management ? `<@&${config.roles.management}>` : 'غير محدد'}`,
          `الدعم: ${config.roles.support ? `<@&${config.roles.support}>` : 'غير محدد'}`,
          `الإشراف: ${config.roles.moderator ? `<@&${config.roles.moderator}>` : 'غير محدد'}`,
        ].join('\n'), inline: false },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
