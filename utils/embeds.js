'use strict';

const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const { EMBED_FOOTER } = require('./constants');

function baseEmbed(color = config.colors.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: EMBED_FOOTER })
    .setTimestamp();
}

function successEmbed(title, description) {
  return baseEmbed(config.colors.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description || null);
}

function errorEmbed(title, description) {
  return baseEmbed(config.colors.error)
    .setTitle(`❌ ${title}`)
    .setDescription(description || null);
}

function warningEmbed(title, description) {
  return baseEmbed(config.colors.warning)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description || null);
}

function infoEmbed(title, description) {
  return baseEmbed(config.colors.info)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description || null);
}

function ticketEmbed(ticket, ticketType, claimedMember = null) {
  const { STATUS_LABELS, PRIORITY_LABELS } = require('./constants');
  const { formatTimestamp } = require('./sanitizers');

  const embed = baseEmbed(config.colors.ticket)
    .setTitle(`🎫 تذكرة #${ticket.id} | Ticket #${ticket.id}`)
    .addFields(
      { name: '👤 المُرسِل / Creator', value: `<@${ticket.creator_id}>`, inline: true },
      { name: '📂 النوع / Type', value: ticketType ? `${ticketType.emoji} ${ticketType.nameAr} / ${ticketType.nameEn}` : ticket.ticket_type, inline: true },
      { name: '📋 الحالة / Status', value: STATUS_LABELS[ticket.status] || ticket.status, inline: true },
      { name: '📌 الموضوع / Subject', value: ticket.subject || 'غير محدد', inline: false },
      { name: '📝 الوصف / Description', value: ticket.description || 'غير محدد', inline: false },
      { name: '🔖 الأولوية / Priority', value: PRIORITY_LABELS[ticket.priority] || ticket.priority, inline: true },
      { name: '👮 مُستلَم بواسطة / Claimed By', value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : 'لم يُستلَم / Unclaimed', inline: true },
      { name: '🕐 تاريخ الإنشاء / Created At', value: formatTimestamp(ticket.created_at), inline: true },
    );

  if (ticket.closed_at) {
    embed.addFields({ name: '🔒 تاريخ الإغلاق / Closed At', value: formatTimestamp(ticket.closed_at), inline: true });
  }

  return embed;
}

function moderationEmbed(action, moderator, target, reason, extra = {}) {
  const embed = baseEmbed(config.colors.moderation)
    .setTitle(`🔨 ${action}`)
    .addFields(
      { name: '🎯 العضو / Target', value: `${target.tag || target.user?.tag || target.id} (${target.id || 'N/A'})`, inline: true },
      { name: '👮 المشرف / Moderator', value: `${moderator.user?.tag || moderator.tag}`, inline: true },
      { name: '📝 السبب / Reason', value: reason || 'لم يُحدد / Not specified', inline: false },
    );

  if (extra.duration) embed.addFields({ name: '⏱️ المدة / Duration', value: extra.duration, inline: true });
  if (extra.messages) embed.addFields({ name: '🗑️ الرسائل / Messages', value: String(extra.messages), inline: true });

  return embed;
}

module.exports = { baseEmbed, successEmbed, errorEmbed, warningEmbed, infoEmbed, ticketEmbed, moderationEmbed };
