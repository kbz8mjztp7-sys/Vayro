'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { parseDurationToMs } = require('../../services/moderationService');
const { logModAction } = require('../../services/loggingService');
const { isModerator, canModerateTarget } = require('../../utils/permissions');
const { formatDuration } = require('../../utils/sanitizers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('إسكات عضو مؤقتاً / Temporarily timeout a member')
    .addUserOption(o => o.setName('user').setDescription('العضو / Member').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('المدة (مثال: 10m, 1h, 1d) / Duration (e.g. 10m, 1h, 1d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب / Reason').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ العضو غير موجود. / Member not found.', ephemeral: true });
    if (!canModerateTarget(interaction.member, target)) return interaction.reply({ content: '❌ لا يمكنك إسكات هذا العضو. / Cannot timeout this member.', ephemeral: true });

    const durationStr = interaction.options.getString('duration');
    const ms = await parseDurationToMs(durationStr);
    if (!ms) return interaction.reply({ content: '❌ مدة غير صالحة. الأمثلة: 10m, 1h, 1d, 7d\nInvalid duration. Examples: 10m, 1h, 1d, 7d', ephemeral: true });

    const reason = interaction.options.getString('reason') || 'لم يُحدد / Not specified';
    await interaction.deferReply({ ephemeral: true });

    await target.timeout(ms, reason);
    await logModAction('إسكات مؤقت / Timeout', { type: 'timeout', moderator: interaction.member.id, target: target.id, reason, duration: formatDuration(ms) });
    await interaction.editReply({ content: `✅ تم إسكات <@${target.id}> لمدة ${formatDuration(ms)}.\nSbject: ${reason}` });
    await target.send(`🔇 تم إسكاتك في **${interaction.guild.name}** لمدة ${formatDuration(ms)}.\nالسبب: ${reason}`).catch(() => {});
  },
};
