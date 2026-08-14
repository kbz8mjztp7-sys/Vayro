'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { logModAction } = require('../../services/loggingService');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('رفع الإسكات عن عضو / Remove timeout from a member')
    .addUserOption(o => o.setName('user').setDescription('العضو / Member').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب / Reason').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ العضو غير موجود. / Member not found.', ephemeral: true });
    if (!target.communicationDisabledUntil) return interaction.reply({ content: '❌ العضو ليس مُسكَتاً. / Member is not timed out.', ephemeral: true });

    const reason = interaction.options.getString('reason') || 'لم يُحدد / Not specified';
    await interaction.deferReply({ ephemeral: true });

    await target.timeout(null, reason);
    await logModAction('رفع الإسكات / Timeout Removed', { type: 'untimeout', moderator: interaction.member.id, target: target.id, reason });
    await interaction.editReply({ content: `✅ تم رفع الإسكات عن <@${target.id}>. / Timeout removed from <@${target.id}>.` });
  },
};
