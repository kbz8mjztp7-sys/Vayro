'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { removeAutoReply } = require('../../services/autoReplyService');
const { logConfigChange } = require('../../services/loggingService');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoreply-remove')
    .setDescription('حذف رد تلقائي / Remove an auto-reply by ID')
    .setDefaultMemberPermissions(0x8)
    .addIntegerOption(o => o.setName('id').setDescription('رقم الرد / Auto-reply ID').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    const id = interaction.options.getInteger('id');
    await interaction.deferReply({ ephemeral: true });

    const removed = await removeAutoReply(interaction.guild.id, id);
    if (!removed) return interaction.editReply({ content: `❌ الرد التلقائي #${id} غير موجود. / Auto-reply #${id} not found.` });

    await logConfigChange('حذف رد تلقائي / Auto-reply Removed', { performer: interaction.member.id, details: `ID #${id}` });
    await interaction.editReply({ content: `✅ تم حذف الرد التلقائي #${id}. / Auto-reply #${id} removed.` });
  },
};
