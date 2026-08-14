'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { addWarning } = require('../../services/moderationService');
const { isModerator, canModerateTarget } = require('../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('إنذار عضو / Warn a member')
    .addUserOption(o => o.setName('user').setDescription('العضو / Member').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب / Reason').setRequired(true).setMaxLength(500)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ العضو غير موجود. / Member not found.', ephemeral: true });
    if (!canModerateTarget(interaction.member, target)) return interaction.reply({ content: '❌ لا يمكنك إنذار هذا العضو. / Cannot warn this member.', ephemeral: true });

    const reason = interaction.options.getString('reason');
    await interaction.deferReply({ ephemeral: true });

    const warning = await addWarning(interaction.guild.id, target.id, interaction.member.id, reason);
    const embed = successEmbed('تم الإنذار / Warning Issued', `تم إنذار <@${target.id}>\nالسبب: ${reason}\nرقم الإنذار: #${warning.id}`);
    await interaction.editReply({ embeds: [embed] });

    // DM the warned user
    await target.send(`⚠️ تلقيت إنذاراً في **${interaction.guild.name}**\nالسبب: ${reason}\nرقم الإنذار: #${warning.id}`).catch(() => {});
  },
};
