'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { getWarnings } = require('../../services/moderationService');
const { isModerator } = require('../../utils/permissions');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('عرض إنذارات عضو / View member warnings')
    .addUserOption(o => o.setName('user').setDescription('العضو / Member').setRequired(true)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const target = interaction.options.getUser('user');
    await interaction.deferReply({ ephemeral: true });

    const warns = await getWarnings(interaction.guild.id, target.id);
    if (warns.length === 0) {
      return interaction.editReply({ content: `✅ <@${target.id}> لا يوجد لديه إنذارات نشطة. / No active warnings.` });
    }

    const embed = baseEmbed(config.colors.warning)
      .setTitle(`⚠️ إنذارات ${target.username} / Warnings for ${target.username}`)
      .setDescription(warns.slice(0, 10).map(w =>
        `**#${w.id}** — <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:D>\nالمشرف: <@${w.moderator_id}>\nالسبب: ${w.reason}`
      ).join('\n\n'))
      .setFooter({ text: `إجمالي الإنذارات النشطة: ${warns.length}` });

    await interaction.editReply({ embeds: [embed] });
  },
};
