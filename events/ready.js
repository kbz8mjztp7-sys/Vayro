'use strict';

const { ActivityType } = require('discord.js');
const config = require('../config/config');
const { setClient } = require('../services/loggingService');
const { setDiscordClient } = require('../web/healthServer');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[READY] ✅ Logged in as ${client.user.tag}`);
    setClient(client);
    setDiscordClient(client);

    // Set streaming presence
    const twitchUrl = config.bot.twitchUrl;
    const isValidTwitch = twitchUrl && twitchUrl.startsWith('https://twitch.tv/');

    try {
      if (isValidTwitch) {
        client.user.setPresence({
          status: 'online',
          activities: [{
            name: config.bot.statusText,
            type: ActivityType.Streaming,
            url: twitchUrl,
          }],
        });
        console.log(`[READY] 🎮 Status set to Streaming: ${config.bot.statusText}`);
      } else {
        client.user.setPresence({
          status: 'online',
          activities: [{
            name: config.bot.statusText,
            type: ActivityType.Watching,
          }],
        });
        console.log(`[READY] 👀 Status set to Watching: ${config.bot.statusText} (Twitch URL invalid, fallback used)`);
      }
    } catch (err) {
      console.error('[READY] Failed to set presence:', err.message);
    }

    console.log(`[READY] 📊 Serving ${client.guilds.cache.size} guild(s), ${client.users.cache.size} cached users`);
  },
};
