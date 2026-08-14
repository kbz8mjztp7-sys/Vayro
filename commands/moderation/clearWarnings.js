'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { clearWarnings } = require('../../services/moderationService');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-warnings')
    .setDescription('مسح جميع إنذارات عضو / Clear all warnings for a member')
    .setDefaultMemberPermissions(0x8)
    .addUserOption(o => o.setName('user').setDescription('العضو / Member').setRequired(true)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    const target = interaction.options.getUser('user');
    await interaction.deferReply({ ephemeral: true });

    const count = await clearWarnings(interaction.guild.id, target.id, interaction.member.id);
    await interaction.editReply({ content: `✅ تم مسح ${count} إنذار للعضو <@${target.id}>. / Cleared ${count} warnings for <@${target.id}>.` });
  },
};
