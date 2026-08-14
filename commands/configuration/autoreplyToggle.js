'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { toggleAutoReply } = require('../../services/autoReplyService');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoreply-toggle')
    .setDescription('تفعيل أو تعطيل رد تلقائي / Toggle an auto-reply on/off')
    .setDefaultMemberPermissions(0x8)
    .addIntegerOption(o => o.setName('id').setDescription('رقم الرد / Auto-reply ID').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    const id = interaction.options.getInteger('id');
    await interaction.deferReply({ ephemeral: true });

    const updated = await toggleAutoReply(interaction.guild.id, id);
    if (!updated) return interaction.editReply({ content: `❌ الرد التلقائي #${id} غير موجود. / Auto-reply #${id} not found.` });
    await interaction.editReply({ content: `✅ الرد التلقائي #${id} الآن ${updated.enabled ? 'مُفعَّل ✅' : 'مُعطَّل ❌'}. / Auto-reply #${id} is now ${updated.enabled ? 'enabled ✅' : 'disabled ❌'}.` });
  },
};
