'use strict';

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('عرض صورة العضو / Show member avatar')
    .addUserOption(opt => opt.setName('user').setDescription('العضو / Member').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild?.members.cache.get(target.id);

    const globalAvatar = target.displayAvatarURL({ size: 512, extension: 'png' });
    const serverAvatar = member?.displayAvatarURL({ size: 512, extension: 'png' });

    const embed = baseEmbed(config.colors.primary)
      .setTitle(`🖼️ صورة ${target.username}`)
      .setImage(serverAvatar || globalAvatar);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🔗 فتح الصورة / Open Avatar')
        .setURL(serverAvatar || globalAvatar)
        .setStyle(ButtonStyle.Link),
    );

    if (serverAvatar && serverAvatar !== globalAvatar) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('🌍 الصورة العامة / Global Avatar')
          .setURL(globalAvatar)
          .setStyle(ButtonStyle.Link),
      );
    }

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
