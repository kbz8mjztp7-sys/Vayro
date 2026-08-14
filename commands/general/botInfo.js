'use strict';

const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');
const { testConnection } = require('../../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-info')
    .setDescription('معلومات البوت / Bot information'),

  async execute(interaction) {
    await interaction.deferReply();
    const dbOk = await testConnection().catch(() => false);
    const client = interaction.client;

    const uptime = formatUptime(client.uptime);
    const memUsage = process.memoryUsage();
    const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);

    const embed = baseEmbed(config.colors.primary)
      .setTitle('🤖 Vyro Management System')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '⏱️ وقت التشغيل / Uptime', value: uptime, inline: true },
        { name: '🏠 السيرفرات / Guilds', value: String(client.guilds.cache.size), inline: true },
        { name: '👥 المستخدمون / Users', value: String(client.users.cache.size), inline: true },
        { name: '📡 تأخير / Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: '💾 الذاكرة / Memory', value: `${memMB} MB`, inline: true },
        { name: '🗄️ قاعدة البيانات / Database', value: dbOk ? '✅ متصلة / Connected' : '❌ غير متصلة', inline: true },
        { name: '📦 discord.js', value: `v${djsVersion}`, inline: true },
        { name: '🟢 Node.js', value: process.version, inline: true },
        { name: '⚙️ المنصة / Platform', value: process.platform, inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s % 60}s`].filter(Boolean).join(' ');
}
