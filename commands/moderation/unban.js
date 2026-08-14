'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { logModAction } = require('../../services/loggingService');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('رفع حظر عضو / Unban a user by ID')
    .addStringOption(o => o.setName('userid').setDescription('معرف المستخدم / User ID').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب / Reason').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const userId = interaction.options.getString('userid');
    if (!/^\d{17,20}$/.test(userId)) return interaction.reply({ content: '❌ معرف المستخدم غير صالح. / Invalid user ID.', ephemeral: true });

    const reason = interaction.options.getString('reason') || 'لم يُحدد / Not specified';
    await interaction.deferReply({ ephemeral: true });

    try {
      await interaction.guild.members.unban(userId, reason);
      await logModAction('رفع الحظر / Member Unbanned', { type: 'unban', moderator: interaction.member.id, target: userId, reason });
      await interaction.editReply({ content: `✅ تم رفع الحظر عن <@${userId}> (${userId}). / Unbanned <@${userId}>.` });
    } catch {
      await interaction.editReply({ content: `❌ هذا المستخدم غير محظور أو المعرف غير صالح. / User not banned or invalid ID.` });
    }
  },
};
