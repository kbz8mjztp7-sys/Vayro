'use strict';

const { EmbedBuilder } = require('discord.js');
const { query } = require('../database/database');
const { logMemberLeave } = require('../services/loggingService');

function applyVariables(str, member, guild) {
  return str
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, guild.name)
    .replace(/{memberCount}/g, String(guild.memberCount));
}

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    await logMemberLeave(member).catch(() => {});

    try {
      const result = await query(
        `SELECT * FROM server_settings WHERE guild_id=$1`,
        [member.guild.id]
      );
      const settings = result.rows[0];
      if (!settings || !settings.goodbye_enabled || !settings.goodbye_channel_id) return;

      const channel = await client.channels.fetch(settings.goodbye_channel_id).catch(() => null);
      if (!channel) return;

      const color = parseInt(settings.goodbye_color || 'ED4245', 16);
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(applyVariables(settings.goodbye_title || 'وداعاً 👋', member, member.guild))
        .setDescription(applyVariables(settings.goodbye_description || 'غادرنا {username}', member, member.guild))
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: member.guild.name });

      if (member.joinedAt) {
        embed.addFields({
          name: '📅 تاريخ الانضمام / Joined At',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`,
          inline: true,
        });
      }

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[GOODBYE] Error:', err.message);
    }
  },
};
