'use strict';

const { EmbedBuilder } = require('discord.js');
const { query } = require('../database/database');
const { logMemberJoin } = require('../services/loggingService');

function applyVariables(str, member, guild) {
  return str
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, guild.name)
    .replace(/{memberCount}/g, String(guild.memberCount))
    .replace(/{accountCreated}/g, `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`);
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    await logMemberJoin(member).catch(() => {});

    try {
      const result = await query(
        `SELECT * FROM server_settings WHERE guild_id=$1`,
        [member.guild.id]
      );
      const settings = result.rows[0];
      if (!settings || !settings.welcome_enabled || !settings.welcome_channel_id) return;

      const channel = await client.channels.fetch(settings.welcome_channel_id).catch(() => null);
      if (!channel) return;

      const color = parseInt(settings.welcome_color || '5865F2', 16);
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(applyVariables(settings.welcome_title || 'مرحباً بك! 👋', member, member.guild))
        .setDescription(applyVariables(settings.welcome_description || 'مرحباً {user}!', member, member.guild))
        .setTimestamp()
        .setFooter({ text: member.guild.name });

      if (settings.welcome_thumbnail) {
        embed.setThumbnail(settings.welcome_thumbnail === 'avatar' ? member.user.displayAvatarURL() : settings.welcome_thumbnail);
      } else {
        embed.setThumbnail(member.user.displayAvatarURL());
      }

      if (settings.welcome_image) embed.setImage(settings.welcome_image);

      await channel.send({ content: `<@${member.id}>`, embeds: [embed] });

      // Auto role assignment
      if (settings.welcome_auto_role) {
        const role = member.guild.roles.cache.get(settings.welcome_auto_role);
        if (role) {
          await member.roles.add(role).catch(err => console.error('[WELCOME] Auto-role error:', err.message));
        }
      }
    } catch (err) {
      console.error('[WELCOME] Error:', err.message);
    }
  },
};
