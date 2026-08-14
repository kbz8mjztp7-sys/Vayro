'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('اختبار استجابة البوت / Check bot response time'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 جاري القياس...', fetchReply: true });
    const ws = interaction.client.ws.ping;
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = baseEmbed(config.colors.success)
      .setTitle('🏓 Pong! استجابة البوت')
      .addFields(
        { name: '📡 تأخير WebSocket / WS Latency', value: `${ws}ms`, inline: true },
        { name: '⚡ زمن الاستجابة / Round-trip', value: `${roundtrip}ms`, inline: true },
        { name: '⏱️ وقت التشغيل / Uptime', value: formatUptime(interaction.client.uptime), inline: true },
      );

    await interaction.editReply({ content: '', embeds: [embed] });
  },
};

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${sec}s`].filter(Boolean).join(' ');
}
