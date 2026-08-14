'use strict';

const { AttachmentBuilder } = require('discord.js');
const { escapeHtml } = require('../utils/sanitizers');
const config = require('../config/config');

async function generateTranscript(channel, ticket, ticketTypeName) {
  const messages = await fetchAllMessages(channel);

  const html = buildHtml(messages, channel, ticket, ticketTypeName);
  const filename = `transcript-ticket-${ticket.id}-${Date.now()}.html`;
  const buffer = Buffer.from(html, 'utf-8');
  const attachment = new AttachmentBuilder(buffer, { name: filename });
  return { attachment, filename, messageCount: messages.length };
}

async function fetchAllMessages(channel) {
  const messages = [];
  let lastId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;
    messages.unshift(...batch.values());
    lastId = batch.last()?.id;
    if (batch.size < 100) break;
  }

  return messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

function buildHtml(messages, channel, ticket, ticketTypeName) {
  const msgHtml = messages.map(msg => {
    const avatar = msg.author.displayAvatarURL({ size: 32, extension: 'png' });
    const timestamp = new Date(msg.createdTimestamp).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });
    const content = escapeHtml(msg.content) || '<em style="color:#888">لا يوجد نص / No text</em>';
    
    const attachments = msg.attachments.size > 0
      ? [...msg.attachments.values()].map(a =>
          a.contentType?.startsWith('image/') 
            ? `<br><img src="${escapeHtml(a.url)}" style="max-width:400px;max-height:300px;border-radius:4px;margin-top:8px" alt="attachment">`
            : `<br><a href="${escapeHtml(a.url)}" style="color:#5865F2">${escapeHtml(a.name)}</a>`
        ).join('')
      : '';

    const replyTo = msg.reference?.messageId
      ? `<div style="border-left:2px solid #4f545c;padding-left:8px;margin-bottom:4px;color:#8d9196;font-size:12px">↩️ يرد على رسالة / Replying</div>`
      : '';

    return `
    <div class="msg">
      <img class="avatar" src="${avatar}" alt="avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
      <div class="msg-body">
        ${replyTo}
        <div class="msg-header">
          <span class="author" style="color:${msg.author.bot ? '#5865F2' : '#fff'}">${escapeHtml(msg.author.tag)}</span>
          <span class="time">${timestamp}</span>
        </div>
        <div class="msg-content">${content}${attachments}</div>
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>نسخة التذكرة #${ticket.id} | Ticket Transcript #${ticket.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #313338; color: #dcddde; font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; }
  .header { background: #2b2d31; padding: 20px; border-bottom: 2px solid #5865F2; }
  .header h1 { color: #5865F2; font-size: 22px; margin-bottom: 8px; }
  .header-info { display: flex; flex-wrap: wrap; gap: 16px; font-size: 14px; color: #8d9196; }
  .header-info span { background: #383a40; padding: 4px 12px; border-radius: 4px; }
  .messages { padding: 16px; max-width: 900px; margin: 0 auto; }
  .msg { display: flex; gap: 12px; padding: 8px 4px; align-items: flex-start; }
  .msg:hover { background: #2e3035; border-radius: 4px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
  .msg-body { flex: 1; }
  .msg-header { margin-bottom: 4px; }
  .author { font-weight: 600; font-size: 15px; margin-left: 8px; }
  .time { font-size: 12px; color: #72767d; }
  .msg-content { font-size: 14px; line-height: 1.5; word-break: break-word; }
  .footer { text-align: center; padding: 20px; color: #72767d; font-size: 12px; border-top: 1px solid #3f4147; margin-top: 20px; }
</style>
</head>
<body>
<div class="header">
  <h1>🎫 نسخة التذكرة | Ticket Transcript</h1>
  <div class="header-info">
    <span>🆔 #${ticket.id}</span>
    <span>📂 ${escapeHtml(ticketTypeName || ticket.ticket_type)}</span>
    <span>📌 ${escapeHtml(ticket.subject)}</span>
    <span>📢 #${escapeHtml(channel.name)}</span>
    <span>💬 ${messages.length} رسالة / messages</span>
    <span>📅 ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</span>
  </div>
</div>
<div class="messages">${msgHtml}</div>
<div class="footer">Vyro Management System — تم إنشاء هذه النسخة تلقائيًا</div>
</body>
</html>`;
}

async function sendTranscript(client, ticket, attachment, filename) {
  const channelId = config.channels.transcript;
  if (!channelId || !client) return false;
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return false;
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📄 نسخة التذكرة #${ticket.id} | Ticket Transcript #${ticket.id}`)
      .addFields(
        { name: '🆔 رقم التذكرة / Ticket ID', value: `#${ticket.id}`, inline: true },
        { name: '👤 المُرسِل / Creator', value: `<@${ticket.creator_id}>`, inline: true },
        { name: '📂 النوع / Type', value: ticket.ticket_type, inline: true },
        { name: '📌 الموضوع / Subject', value: ticket.subject || 'N/A', inline: false },
      )
      .setTimestamp()
      .setFooter({ text: 'Vyro Transcript' });
    await channel.send({ embeds: [embed], files: [attachment] });
    return true;
  } catch (err) {
    console.error('[TRANSCRIPT] Failed to send transcript:', err.message);
    return false;
  }
}

module.exports = { generateTranscript, sendTranscript };
