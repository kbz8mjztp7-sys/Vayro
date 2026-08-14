'use strict';

const config = require('../config/config');

/**
 * Permission utilities - نظام الصلاحيات
 */

function isOwner(userId) {
  return config.ownerId && userId === config.ownerId;
}

function hasRole(member, roleId) {
  if (!roleId || !member) return false;
  return member.roles.cache.has(roleId);
}

function isAdmin(member) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  if (member.permissions.has('Administrator')) return true;
  if (config.roles.admin && hasRole(member, config.roles.admin)) return true;
  return false;
}

function isManagement(member) {
  if (!member) return false;
  if (isAdmin(member)) return true;
  if (config.roles.management && hasRole(member, config.roles.management)) return true;
  return false;
}

function isSupport(member) {
  if (!member) return false;
  if (isManagement(member)) return true;
  if (config.roles.support && hasRole(member, config.roles.support)) return true;
  return false;
}

function isModerator(member) {
  if (!member) return false;
  if (isManagement(member)) return true;
  if (config.roles.moderator && hasRole(member, config.roles.moderator)) return true;
  return false;
}

function isStaff(member) {
  return isSupport(member) || isModerator(member);
}

function canModerateTarget(moderator, target) {
  if (!moderator || !target) return false;
  if (target.id === moderator.id) return false;
  if (target.user && target.user.bot) return false;
  // Owner can never be moderated
  if (isOwner(target.id)) return false;
  // Compare role positions
  if (target.roles && moderator.roles) {
    if (target.roles.highest.position >= moderator.roles.highest.position) {
      return false;
    }
  }
  return true;
}

async function checkTicketPermission(interaction, ticket, requireClaimed = false) {
  const member = interaction.member;
  if (isAdmin(member)) return true;
  if (isManagement(member)) return true;
  if (requireClaimed) {
    return ticket && ticket.claimed_by === member.id;
  }
  if (isSupport(member)) return true;
  if (ticket && ticket.creator_id === member.id) return true;
  return false;
}

module.exports = {
  isOwner,
  hasRole,
  isAdmin,
  isManagement,
  isSupport,
  isModerator,
  isStaff,
  canModerateTarget,
  checkTicketPermission,
};
