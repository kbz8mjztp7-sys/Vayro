'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('عرض معلومات عضو / Show member information')
    .addUserOption(opt => opt.setName('user').setDescription('العضو / Member').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user') || interaction.member;
    const user = target.user || target;

    const roles = target.roles?.cache
      .filter(r => r.id !== interaction.guild.roles.everyone.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .slice(0, 10)
      .join(', ') || 'لا يوجد / None';

    const embed = baseEmbed(config.colors.primary)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔 المعرف / ID', value: user.id, inline: true },
        { name: '🤖 بوت؟ / Bot?', value: user.bot ? 'نعم / Yes' : 'لا / No', inline: true },
        { name: '📅 تاريخ إنشاء الحساب / Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      );

    if (target.joinedAt) {
      embed.addFields({ name: '📥 تاريخ الانضمام / Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true });
    }
    if (target.premiumSinceTimestamp) {
      embed.addFields({ name: '💎 يعزز منذ / Boosting Since', value: `<t:${Math.floor(target.premiumSinceTimestamp / 1000)}:R>`, inline: true });
    }

    embed.addFields({ name: `🎭 الأدوار / Roles (${target.roles?.cache.size - 1 || 0})`, value: roles, inline: false });

    await interaction.reply({ embeds: [embed] });
  },
};
