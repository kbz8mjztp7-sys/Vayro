'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { removeWarning } = require('../../services/moderationService');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-warning')
    .setDescription('حذف إنذار محدد / Remove a specific warning')
    .addIntegerOption(o => o.setName('id').setDescription('رقم الإنذار / Warning ID').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const id = interaction.options.getInteger('id');
    await interaction.deferReply({ ephemeral: true });

    const removed = await removeWarning(id, interaction.member.id);
    if (!removed) return interaction.editReply({ content: `❌ الإنذار #${id} غير موجود أو تم حذفه بالفعل. / Warning not found.` });
    await interaction.editReply({ content: `✅ تم حذف الإنذار #${id} للعضو <@${removed.user_id}>. / Warning #${id} removed.` });
  },
};
