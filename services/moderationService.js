'use strict';

const { query } = require('../database/database');
const { logModAction } = require('./loggingService');

async function addWarning(guildId, userId, moderatorId, reason) {
  const result = await query(
    `INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [guildId, userId, moderatorId, reason]
  );
  await logModAction('تحذير / Warning Issued', { type: 'warn', moderator: moderatorId, target: userId, reason });
  return result.rows[0];
}

async function getWarnings(guildId, userId) {
  const result = await query(
    `SELECT * FROM warnings WHERE guild_id=$1 AND user_id=$2 AND removed_at IS NULL ORDER BY created_at DESC`,
    [guildId, userId]
  );
  return result.rows;
}

async function getAllWarnings(guildId, userId) {
  const result = await query(
    `SELECT * FROM warnings WHERE guild_id=$1 AND user_id=$2 ORDER BY created_at DESC`,
    [guildId, userId]
  );
  return result.rows;
}

async function removeWarning(warningId, removedById) {
  const result = await query(
    `UPDATE warnings SET removed_at=NOW(), removed_by=$1 WHERE id=$2 AND removed_at IS NULL RETURNING *`,
    [removedById, warningId]
  );
  if (result.rows[0]) {
    await logModAction('حذف تحذير / Warning Removed', { type: 'warn', moderator: removedById, target: result.rows[0].user_id });
  }
  return result.rows[0] || null;
}

async function clearWarnings(guildId, userId, clearedById) {
  const result = await query(
    `UPDATE warnings SET removed_at=NOW(), removed_by=$1 WHERE guild_id=$2 AND user_id=$3 AND removed_at IS NULL RETURNING id`,
    [clearedById, guildId, userId]
  );
  await logModAction('مسح جميع التحذيرات / All Warnings Cleared', { type: 'warn', moderator: clearedById, target: userId });
  return result.rowCount;
}

async function parseDurationToMs(durationStr) {
  const match = durationStr.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const ms = val * map[unit];
  // Discord timeout max: 28 days
  if (ms > 28 * 86400000) return null;
  return ms;
}

module.exports = { addWarning, getWarnings, getAllWarnings, removeWarning, clearWarnings, parseDurationToMs };
