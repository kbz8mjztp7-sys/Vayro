'use strict';

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logModAction } = require('../../services/loggingService');
const { isModerator, canModerateTarget } = require('../../utils/permissions');

const pending = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو من السيرفر / Kick a member')
    .addUserOption(o => o.setName('user').setDescription('العضو / Member').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب / Reason').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ العضو غير موجود. / Member not found.', ephemeral: true });
    if (!canModerateTarget(interaction.member, target)) return interaction.reply({ content: '❌ لا يمكنك طرد هذا العضو. / Cannot kick this member.', ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: '❌ لا يمكن للبوت طرد هذا العضو. / Bot cannot kick this member.', ephemeral: true });

    const reason = interaction.options.getString('reason') || 'لم يُحدد / Not specified';
    const key = `kick_${interaction.id}`;
    pending.set(key, { target, reason, moderator: interaction.member });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mod_kick_confirm_${interaction.id}`).setLabel('✅ طرد / Kick').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`mod_kick_cancel_${interaction.id}`).setLabel('❌ إلغاء / Cancel').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ content: `⚠️ هل تريد طرد <@${target.id}>?\nالسبب: ${reason}\nAre you sure you want to kick <@${target.id}>?`, components: [row], ephemeral: true });

    // Register one-time button handler
    const filter = i => i.user.id === interaction.user.id && (i.customId === `mod_kick_confirm_${interaction.id}` || i.customId === `mod_kick_cancel_${interaction.id}`);
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });
    collector.on('collect', async i => {
      pending.delete(key);
      if (i.customId.startsWith('mod_kick_confirm')) {
        await target.kick(reason);
        await logModAction('طرد عضو / Member Kicked', { type: 'kick', moderator: interaction.member.id, target: target.id, reason });
        await i.update({ content: `✅ تم طرد ${target.user.tag}. / ${target.user.tag} was kicked.`, components: [] });
      } else {
        await i.update({ content: '❌ تم إلغاء الأمر. / Cancelled.', components: [] });
      }
    });
    collector.on('end', (_, reason) => { if (reason === 'time') pending.delete(key); });
  },
};
