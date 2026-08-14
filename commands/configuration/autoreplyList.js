'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { listAutoReplies } = require('../../services/autoReplyService');
const { isAdmin } = require('../../utils/permissions');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoreply-list')
    .setDescription('قائمة الردود التلقائية / List all auto-replies')
    .setDefaultMemberPermissions(0x8),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });

    const replies = await listAutoReplies(interaction.guild.id);
    if (replies.length === 0) {
      return interaction.editReply({ content: '📋 لا توجد ردود تلقائية مُعرَّفة. / No auto-replies defined.' });
    }

    const embed = baseEmbed(config.colors.primary)
      .setTitle(`📋 الردود التلقائية / Auto-Replies (${replies.length})`)
      .setDescription(replies.slice(0, 15).map(r =>
        `**#${r.id}** ${r.enabled ? '✅' : '❌'} \`${r.trigger_text}\` → ${r.response_text.substring(0, 50)}...\nنوع: ${r.match_type}${r.channel_id ? ` | قناة: <#${r.channel_id}>` : ''}`
      ).join('\n\n'));

    if (replies.length > 15) embed.setFooter({ text: `يُعرض 15 من ${replies.length}. / Showing 15 of ${replies.length}.` });
    await interaction.editReply({ embeds: [embed] });
  },
};
