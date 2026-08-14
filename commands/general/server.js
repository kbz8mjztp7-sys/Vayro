'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('عرض معلومات السيرفر / Show server information'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => {});

    const owner = await guild.fetchOwner().catch(() => null);
    const channels = guild.channels.cache;
    const textCount = channels.filter(c => c.type === 0).size;
    const voiceCount = channels.filter(c => c.type === 2).size;
    const categoryCount = channels.filter(c => c.type === 4).size;

    const embed = baseEmbed(config.colors.primary)
      .setTitle(`🏠 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: '🆔 معرف السيرفر / Server ID', value: guild.id, inline: true },
        { name: '👑 المالك / Owner', value: owner ? `<@${owner.id}>` : 'غير معروف', inline: true },
        { name: '📅 تاريخ الإنشاء / Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 الأعضاء / Members', value: String(guild.memberCount), inline: true },
        { name: '💬 قنوات النص / Text Channels', value: String(textCount), inline: true },
        { name: '🔊 قنوات الصوت / Voice Channels', value: String(voiceCount), inline: true },
        { name: '📁 الفئات / Categories', value: String(categoryCount), inline: true },
        { name: '😀 الإيموجي / Emojis', value: String(guild.emojis.cache.size), inline: true },
        { name: '🎭 الأدوار / Roles', value: String(guild.roles.cache.size), inline: true },
        { name: '🚀 مستوى التعزيز / Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
        { name: '💎 عدد التعزيزات / Boosts', value: String(guild.premiumSubscriptionCount || 0), inline: true },
        { name: '🔒 التحقق / Verification', value: guild.verificationLevel.toString(), inline: true },
      );

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

    await interaction.reply({ embeds: [embed] });
  },
};
