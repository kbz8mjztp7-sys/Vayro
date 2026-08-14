'use strict';

const path = require('path');
const { AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config/config');

const BANNER_PATH = path.join(__dirname, '..', 'assets', 'banner.jpeg');

/**
 * Sends the Vyro banner image after any member who has explicit
 * SendMessages permission in the banner channel posts a message.
 */
async function handleBanner(message) {
  // Only trigger in the designated banner channel
  if (message.channelId !== config.channels.banner) return false;

  // Must be in a guild with a resolvable member
  const member = message.member;
  if (!member) return false;

  // Check if the member has explicit SendMessages permission in this channel
  const perms = message.channel.permissionsFor(member);
  if (!perms || !perms.has(PermissionFlagsBits.SendMessages)) return false;

  try {
    const attachment = new AttachmentBuilder(BANNER_PATH, { name: 'vyro-banner.jpeg' });
    await message.channel.send({ files: [attachment] });
    return true;
  } catch (err) {
    console.error('[BANNER] Failed to send banner:', err.message);
    return false;
  }
}

module.exports = { handleBanner };
