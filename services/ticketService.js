'use strict';

const { PermissionsBitField, ChannelType } = require('discord.js');
const { query, transaction } = require('../database/database');
const config = require('../config/config');
const ticketTypes = require('../config/ticketTypes');
const { sanitizeChannelName, sanitizeUsername } = require('../utils/sanitizers');
const { logTicketAction } = require('./loggingService');
const { ticketCooldownKey, checkCooldown, setCooldown } = require('../utils/cooldowns');

const TICKET_COOLDOWN = 60; // seconds

function getTicketType(typeId) {
  return ticketTypes.find(t => t.id === typeId) || null;
}

async function getTicketByChannel(channelId) {
  const result = await query(
    'SELECT * FROM tickets WHERE channel_id = $1 AND deleted_at IS NULL',
    [channelId]
  );
  return result.rows[0] || null;
}

async function getTicketById(ticketId) {
  const result = await query(
    'SELECT * FROM tickets WHERE id = $1',
    [ticketId]
  );
  return result.rows[0] || null;
}

async function createTicket(guild, creator, ticketType, subject, description, extraData = {}) {
  // Cooldown check
  const cooldownKey = ticketCooldownKey(guild.id, creator.id, ticketType.id);
  const remaining = checkCooldown(cooldownKey, TICKET_COOLDOWN);
  if (remaining > 0) {
    throw { type: 'COOLDOWN', remaining };
  }

  // Duplicate ticket check (unless allowMultiple)
  if (!ticketType.allowMultiple) {
    const existing = await query(
      `SELECT id FROM tickets WHERE guild_id=$1 AND creator_id=$2 AND ticket_type=$3 AND status NOT IN ('closed','deleted')`,
      [guild.id, creator.id, ticketType.id]
    );
    if (existing.rows.length > 0) {
      throw { type: 'DUPLICATE', ticketId: existing.rows[0].id };
    }
  }

  // Determine category
  const categoryId = ticketType.categoryIdOverride || config.channels.ticketCategory;
  const supportRoleId = ticketType.supportRoleOverride || config.roles.support;

  // Create the channel
  const channelName = `${sanitizeChannelName(ticketType.nameEn)}-${sanitizeUsername(creator.username)}`
    .substring(0, 100);

  const permissionOverwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: creator.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
  ];

  if (supportRoleId) {
    permissionOverwrites.push({
      id: supportRoleId,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
    });
  }
  if (config.roles.management) {
    permissionOverwrites.push({
      id: config.roles.management,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
    });
  }
  if (config.roles.admin) {
    permissionOverwrites.push({
      id: config.roles.admin,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
    });
  }

  const channelOptions = {
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites,
  };
  if (categoryId) channelOptions.parent = categoryId;

  const channel = await guild.channels.create(channelOptions);

  // Store in DB
  const result = await query(
    `INSERT INTO tickets (guild_id, channel_id, creator_id, ticket_type, subject, description, status, category_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, NOW()) RETURNING *`,
    [guild.id, channel.id, creator.id, ticketType.id, subject, description, categoryId]
  );
  const ticket = result.rows[0];

  setCooldown(cooldownKey, TICKET_COOLDOWN);

  await logTicketAction('تذكرة جديدة / Ticket Created', {
    ticketId: ticket.id,
    performer: creator.id,
    channel: channel.id,
    details: { 'النوع / Type': `${ticketType.nameAr} / ${ticketType.nameEn}`, 'الموضوع / Subject': subject },
  });

  return { ticket, channel };
}

async function claimTicket(ticketId, staffMemberId, client) {
  return await transaction(async (dbClient) => {
    // Atomic claim with row lock
    const check = await dbClient.query(
      `SELECT * FROM tickets WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [ticketId]
    );
    const ticket = check.rows[0];
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.claimed_by) throw { type: 'ALREADY_CLAIMED', claimedBy: ticket.claimed_by };

    await dbClient.query(
      `UPDATE tickets SET claimed_by=$1, status='claimed', claimed_at=NOW() WHERE id=$2`,
      [staffMemberId, ticketId]
    );

    await dbClient.query(
      `INSERT INTO ticket_actions (ticket_id, action, performed_by, created_at) VALUES ($1, 'claimed', $2, NOW())`,
      [ticketId, staffMemberId]
    );

    return { ...ticket, claimed_by: staffMemberId, status: 'claimed' };
  });
}

async function unclaimTicket(ticketId, staffMemberId) {
  const result = await query(
    `UPDATE tickets SET claimed_by=NULL, status='open', claimed_at=NULL WHERE id=$1 RETURNING *`,
    [ticketId]
  );
  await query(
    `INSERT INTO ticket_actions (ticket_id, action, performed_by, created_at) VALUES ($1, 'unclaimed', $2, NOW())`,
    [ticketId, staffMemberId]
  );
  return result.rows[0];
}

async function closeTicket(ticketId, closedById) {
  const result = await query(
    `UPDATE tickets SET status='closed', closed_at=NOW() WHERE id=$1 RETURNING *`,
    [ticketId]
  );
  await query(
    `INSERT INTO ticket_actions (ticket_id, action, performed_by, created_at) VALUES ($1, 'closed', $2, NOW())`,
    [ticketId, closedById]
  );
  return result.rows[0];
}

async function reopenTicket(ticketId, reopenedById) {
  const result = await query(
    `UPDATE tickets SET status='open', closed_at=NULL WHERE id=$1 RETURNING *`,
    [ticketId]
  );
  await query(
    `INSERT INTO ticket_actions (ticket_id, action, performed_by, created_at) VALUES ($1, 'reopened', $2, NOW())`,
    [ticketId, reopenedById]
  );
  return result.rows[0];
}

async function deleteTicket(ticketId, deletedById) {
  const result = await query(
    `UPDATE tickets SET status='deleted', deleted_at=NOW() WHERE id=$1 RETURNING *`,
    [ticketId]
  );
  await query(
    `INSERT INTO ticket_actions (ticket_id, action, performed_by, created_at) VALUES ($1, 'deleted', $2, NOW())`,
    [ticketId, deletedById]
  );
  return result.rows[0];
}

async function updateTicketField(ticketId, field, value) {
  const allowed = ['claimed_by','transferred_to','priority','status','opening_message_id','category_id'];
  if (!allowed.includes(field)) throw new Error('Invalid field');
  const result = await query(
    `UPDATE tickets SET ${field}=$1 WHERE id=$2 RETURNING *`,
    [value, ticketId]
  );
  return result.rows[0];
}

async function addParticipant(ticketId, userId, addedById) {
  try {
    await query(
      `INSERT INTO ticket_participants (ticket_id, user_id, added_by, created_at) VALUES ($1, $2, $3, NOW())`,
      [ticketId, userId, addedById]
    );
    await query(
      `INSERT INTO ticket_actions (ticket_id, action, performed_by, target_user_id, created_at) VALUES ($1, 'participant_added', $2, $3, NOW())`,
      [ticketId, addedById, userId]
    );
    return true;
  } catch (err) {
    if (err.code === '23505') return false; // duplicate
    throw err;
  }
}

async function removeParticipant(ticketId, userId, removedById) {
  await query(
    `DELETE FROM ticket_participants WHERE ticket_id=$1 AND user_id=$2`,
    [ticketId, userId]
  );
  await query(
    `INSERT INTO ticket_actions (ticket_id, action, performed_by, target_user_id, created_at) VALUES ($1, 'participant_removed', $2, $3, NOW())`,
    [ticketId, removedById, userId]
  );
}

async function getParticipants(ticketId) {
  const result = await query(
    `SELECT user_id FROM ticket_participants WHERE ticket_id=$1`,
    [ticketId]
  );
  return result.rows.map(r => r.user_id);
}

module.exports = {
  getTicketType,
  getTicketByChannel,
  getTicketById,
  createTicket,
  claimTicket,
  unclaimTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  updateTicketField,
  addParticipant,
  removeParticipant,
  getParticipants,
};
