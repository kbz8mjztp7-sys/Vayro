'use strict';

module.exports = {
  TICKET_STATUS: {
    OPEN: 'open',
    CLAIMED: 'claimed',
    REVIEW: 'review',
    CLOSED: 'closed',
    DELETED: 'deleted',
  },

  TICKET_PRIORITY: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  },

  PRIORITY_LABELS: {
    low: '🟢 منخفض / Low',
    normal: '🔵 عادي / Normal',
    high: '🟠 عالي / High',
    urgent: '🔴 عاجل / Urgent',
  },

  STATUS_LABELS: {
    open: '🟢 مفتوحة / Open',
    claimed: '🔵 مُستلمة / Claimed',
    review: '🟡 قيد المراجعة / Under Review',
    closed: '🔒 مغلقة / Closed',
    deleted: '🗑️ محذوفة / Deleted',
  },

  MATCH_TYPES: {
    EXACT: 'exact',
    CONTAINS: 'contains',
    STARTS_WITH: 'starts_with',
  },

  COOLDOWNS: {
    TICKET_CREATE: 60,      // seconds between ticket creations
    COMMAND_DEFAULT: 3,
    MODERATION: 5,
  },

  MAX_CHANNEL_NAME_LENGTH: 100,
  MAX_TICKET_SUBJECT_LENGTH: 100,
  MAX_TICKET_DESC_LENGTH: 1000,

  EMBED_FOOTER: 'Vyro Management System',
  BOT_NAME: 'Vyro Management System',
};
