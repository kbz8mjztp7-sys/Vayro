'use strict';

const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

let client = null;

function setClient(discordClient) {
  client = discordClient;
}

async function sendLog(channelId, embed) {
  if (!client || !channelId) return;
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[LOG] Failed to send log:', err.message);
  }
}

async function logTicketAction(action, data = {}) {
  const channelId = config.channels.log;
  if (!channelId) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`🎫 ${action}`)
    .setTimestamp()
    .setFooter({ text: 'Vyro Ticket Log' });

  if (data.ticketId) embed.addFields({ name: '🆔 رقم التذكرة / Ticket ID', value: `#${data.ticketId}`, inline: true });
  if (data.performer) embed.addFields({ name: '👤 المنفذ / Performed By', value: `<@${data.performer}>`, inline: true });
  if (data.target) embed.addFields({ name: '🎯 الهدف / Target', value: `<@${data.target}>`, inline: true });
  if (data.channel) embed.addFields({ name: '📢 القناة / Channel', value: `<#${data.channel}>`, inline: true });
  if (data.reason) embed.addFields({ name: '📝 السبب / Reason', value: data.reason, inline: false });
  if (data.details) {
    for (const [key, value] of Object.entries(data.details)) {
      embed.addFields({ name: key, value: String(value).substring(0, 1024), inline: true });
    }
  }

  await sendLog(channelId, embed);
}

async function logModAction(action, data = {}) {
  const channelId = config.channels.modLog || config.channels.log;
  if (!channelId) return;

  const colorMap = {
    warn: 0xFEE75C,
    timeout: 0xFF6B35,
    kick: 0xFF6B35,
    ban: 0xED4245,
    unban: 0x57F287,
    lock: 0xED4245,
    unlock: 0x57F287,
    clear: 0x5865F2,
  };

  const embed = new EmbedBuilder()
    .setColor(colorMap[data.type] || 0xFF6B35)
    .setTitle(`🔨 ${action}`)
    .setTimestamp()
    .setFooter({ text: 'Vyro Moderation Log' });

  if (data.moderator) embed.addFields({ name: '👮 المشرف / Moderator', value: `<@${data.moderator}>`, inline: true });
  if (data.target) embed.addFields({ name: '🎯 العضو / Member', value: `<@${data.target}>`, inline: true });
  if (data.channel) embed.addFields({ name: '📢 القناة / Channel', value: `<#${data.channel}>`, inline: true });
  if (data.reason) embed.addFields({ name: '📝 السبب / Reason', value: data.reason, inline: false });
  if (data.duration) embed.addFields({ name: '⏱️ المدة / Duration', value: data.duration, inline: true });
  if (data.count) embed.addFields({ name: '🔢 العدد / Count', value: String(data.count), inline: true });

  await sendLog(channelId, embed);
}

async function logMemberJoin(member) {
  const channelId = config.channels.log;
  if (!channelId) return;

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ عضو جديد انضم / Member Joined')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: '👤 العضو / Member', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: '🆔 المعرف / ID', value: member.id, inline: true },
      { name: '📅 تاريخ إنشاء الحساب / Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '👥 عدد الأعضاء / Member Count', value: String(member.guild.memberCount), inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'Vyro Member Log' });

  await sendLog(channelId, embed);
}

async function logMemberLeave(member) {
  const channelId = config.channels.log;
  if (!channelId) return;

  const joinedAt = member.joinedAt
    ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
    : 'غير معروف / Unknown';

  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('❌ عضو غادر / Member Left')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: '👤 العضو / Member', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: '🆔 المعرف / ID', value: member.id, inline: true },
      { name: '📅 تاريخ الانضمام / Joined At', value: joinedAt, inline: true },
      { name: '👥 عدد الأعضاء / Member Count', value: String(member.guild.memberCount), inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'Vyro Member Log' });

  await sendLog(channelId, embed);
}

async function logConfigChange(action, data = {}) {
  const channelId = config.channels.log;
  if (!channelId) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`⚙️ ${action}`)
    .setTimestamp()
    .setFooter({ text: 'Vyro Config Log' });

  if (data.performer) embed.addFields({ name: '👤 المنفذ / Performed By', value: `<@${data.performer}>`, inline: true });
  if (data.details) embed.addFields({ name: '📝 التفاصيل / Details', value: data.details, inline: false });

  await sendLog(channelId, embed);
}

async function logError(context, error) {
  console.error(`[ERROR][${context}]`, error);
  const channelId = config.channels.log;
  if (!channelId) return;

  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('🚨 خطأ في النظام / System Error')
    .addFields(
      { name: '📍 السياق / Context', value: context, inline: true },
      { name: '⚠️ الخطأ / Error', value: `\`\`\`${String(error.message).substring(0, 500)}\`\`\``, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: 'Vyro Error Log' });

  await sendLog(channelId, embed);
}

module.exports = { setClient, logTicketAction, logModAction, logMemberJoin, logMemberLeave, logConfigChange, logError };
