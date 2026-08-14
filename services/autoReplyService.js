'use strict';

const { query } = require('../database/database');

const cooldowns = new Map();

async function getAutoReplies(guildId) {
  const result = await query(
    `SELECT * FROM auto_replies WHERE guild_id=$1 AND enabled=true ORDER BY id`,
    [guildId]
  );
  return result.rows;
}

async function addAutoReply(guildId, triggerText, responseText, matchType, createdById, channelId = null, roleId = null, cooldownSeconds = 30) {
  try {
    const result = await query(
      `INSERT INTO auto_replies (guild_id, trigger_text, response_text, match_type, channel_id, role_id, enabled, cooldown_seconds, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, NOW()) RETURNING *`,
      [guildId, triggerText.toLowerCase(), responseText, matchType, channelId, roleId, cooldownSeconds, createdById]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') throw { type: 'DUPLICATE' };
    throw err;
  }
}

async function removeAutoReply(guildId, id) {
  const result = await query(
    `DELETE FROM auto_replies WHERE guild_id=$1 AND id=$2 RETURNING *`,
    [guildId, id]
  );
  return result.rows[0] || null;
}

async function toggleAutoReply(guildId, id) {
  const result = await query(
    `UPDATE auto_replies SET enabled = NOT enabled WHERE guild_id=$1 AND id=$2 RETURNING *`,
    [guildId, id]
  );
  return result.rows[0] || null;
}

async function listAutoReplies(guildId) {
  const result = await query(
    `SELECT * FROM auto_replies WHERE guild_id=$1 ORDER BY id`,
    [guildId]
  );
  return result.rows;
}

function matchesAutoReply(rule, content) {
  const lower = content.toLowerCase();
  const trigger = rule.trigger_text.toLowerCase();
  switch (rule.match_type) {
    case 'exact': return lower === trigger;
    case 'starts_with': return lower.startsWith(trigger);
    case 'contains': default: return lower.includes(trigger);
  }
}

function checkCooldown(guildId, ruleId, channelId, cooldownSeconds) {
  const key = `${guildId}:${ruleId}:${channelId}`;
  const expiry = cooldowns.get(key);
  if (expiry && Date.now() < expiry) return false;
  cooldowns.set(key, Date.now() + cooldownSeconds * 1000);
  return true;
}

async function processMessage(message) {
  if (message.author.bot || message.webhookId || !message.guild) return;

  let rules;
  try {
    rules = await getAutoReplies(message.guild.id);
  } catch { return; }

  for (const rule of rules) {
    if (!matchesAutoReply(rule, message.content)) continue;
    if (rule.channel_id && rule.channel_id !== message.channel.id) continue;
    if (rule.role_id && !message.member?.roles.cache.has(rule.role_id)) continue;
    if (!checkCooldown(message.guild.id, rule.id, message.channel.id, rule.cooldown_seconds)) continue;

    try {
      await message.channel.send(rule.response_text);
    } catch (err) {
      console.error('[AUTOREPLY] Failed to send reply:', err.message);
    }
    break; // Only one auto-reply per message
  }
}

module.exports = { getAutoReplies, addAutoReply, removeAutoReply, toggleAutoReply, listAutoReplies, processMessage };
