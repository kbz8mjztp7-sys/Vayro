'use strict';

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logModAction } = require('../../services/loggingService');
const { isModerator, canModerateTarget } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو من السيرفر / Ban a member')
    .addUserOption(o => o.setName('user').setDescription('العضو / Member').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب / Reason').setRequired(false).setMaxLength(500))
    .addIntegerOption(o => o.setName('delete_days').setDescription('حذف رسائل (أيام) / Delete messages (days)').setMinValue(0).setMaxValue(7).setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const target = interaction.options.getMember('user') || interaction.options.getUser('user');
    if (!target) return interaction.reply({ content: '❌ العضو غير موجود. / Member not found.', ephemeral: true });
    const member = target.guild ? target : null;
    if (member && !canModerateTarget(interaction.member, member)) return interaction.reply({ content: '❌ لا يمكنك حظر هذا العضو. / Cannot ban this member.', ephemeral: true });

    const reason = interaction.options.getString('reason') || 'لم يُحدد / Not specified';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;
    const userId = target.id || target.user?.id;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mod_ban_confirm_${interaction.id}`).setLabel('🔨 حظر / Ban').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`mod_ban_cancel_${interaction.id}`).setLabel('❌ إلغاء / Cancel').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ content: `⚠️ هل تريد حظر <@${userId}>?\nالسبب: ${reason}\nAre you sure you want to ban <@${userId}>?`, components: [row], ephemeral: true });

    const filter = i => i.user.id === interaction.user.id && (i.customId.includes('ban_confirm') || i.customId.includes('ban_cancel'));
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });
    collector.on('collect', async i => {
      if (i.customId.includes('ban_confirm')) {
        if (member) {
          await member.send(`🔨 تم حظرك من **${interaction.guild.name}**.\nالسبب: ${reason}`).catch(() => {});
        }
        await interaction.guild.members.ban(userId, { reason, deleteMessageDays: deleteDays });
        await logModAction('حظر عضو / Member Banned', { type: 'ban', moderator: interaction.member.id, target: userId, reason });
        await i.update({ content: `✅ تم حظر <@${userId}>. / <@${userId}> was banned.`, components: [] });
      } else {
        await i.update({ content: '❌ تم إلغاء الأمر. / Cancelled.', components: [] });
      }
    });
  },
};
