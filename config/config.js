'use strict';

/**
 * Vyro Management System - Core Configuration
 * النظام: إعدادات النظام الأساسية
 */

const REQUIRED_VARS = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'DATABASE_URL',
];

const OPTIONAL_VARS = [
  'GUILD_ID',
  'OWNER_ID',
  'ADMIN_ROLE_ID',
  'MANAGEMENT_ROLE_ID',
  'SUPPORT_ROLE_ID',
  'MODERATOR_ROLE_ID',
  'TICKET_CATEGORY_ID',
  'CLOSED_TICKET_CATEGORY_ID',
  'REVIEW_TICKET_CATEGORY_ID',
  'WELCOME_CHANNEL_ID',
  'GOODBYE_CHANNEL_ID',
  'LOG_CHANNEL_ID',
  'MOD_LOG_CHANNEL_ID',
  'TRANSCRIPT_CHANNEL_ID',
  'SUGGESTION_CHANNEL_ID',
  'TWITCH_URL',
  'BOT_STATUS_TEXT',
  'COMMAND_SCOPE',
];

function validateEnv() {
  const missing = [];
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    console.error('[CONFIG ERROR] Missing required environment variables:');
    for (const key of missing) {
      console.error(`  ❌ ${key}  ← Add this to Replit Secrets`);
    }
    console.error('\n[CONFIG] The bot cannot start without these secrets.');
    console.error('[CONFIG] Go to: Replit → Tools → Secrets → add the keys above.');
    // Give the health server 500ms to bind before exiting
    setTimeout(() => process.exit(1), 500);
    throw new Error(`Missing secrets: ${missing.join(', ')}`);
  }
  console.log('[CONFIG] ✅ All required environment variables are present.');
}

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  ownerId: process.env.OWNER_ID || null,

  roles: {
    admin: process.env.ADMIN_ROLE_ID || null,
    management: process.env.MANAGEMENT_ROLE_ID || null,
    support: process.env.SUPPORT_ROLE_ID || null,
    moderator: process.env.MODERATOR_ROLE_ID || null,
  },

  channels: {
    ticketCategory: process.env.TICKET_CATEGORY_ID || null,
    closedTicketCategory: process.env.CLOSED_TICKET_CATEGORY_ID || null,
    reviewTicketCategory: process.env.REVIEW_TICKET_CATEGORY_ID || null,
    welcome: process.env.WELCOME_CHANNEL_ID || null,
    goodbye: process.env.GOODBYE_CHANNEL_ID || null,
    log: process.env.LOG_CHANNEL_ID || null,
    modLog: process.env.MOD_LOG_CHANNEL_ID || null,
    transcript: process.env.TRANSCRIPT_CHANNEL_ID || null,
    suggestion: process.env.SUGGESTION_CHANNEL_ID || null,
    // Banner auto-send after owner messages in this channel
    banner: process.env.BANNER_CHANNEL_ID || '1534744014794784918',
  },

  bot: {
    statusText: process.env.BOT_STATUS_TEXT || 'Vyro System',
    twitchUrl: process.env.TWITCH_URL || 'https://twitch.tv/vyro',
    commandScope: process.env.COMMAND_SCOPE || 'guild',
    port: parseInt(process.env.PORT) || 3000,
  },

  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    error: 0xED4245,
    info: 0x5865F2,
    ticket: 0x2B2D31,
    moderation: 0xFF6B35,
  },

  validateEnv,
};

module.exports = config;
