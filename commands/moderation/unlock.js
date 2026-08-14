'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { logModAction } = require('../../services/loggingService');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('فتح القناة / Unlock the channel')
    .addStringOption(o => o.setName('reason').setDescription('السبب / Reason').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const reason = interaction.options.getString('reason') || 'لم يُحدد / Not specified';
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    await logModAction('فتح القناة / Channel Unlocked', { type: 'unlock', moderator: interaction.member.id, channel: interaction.channel.id, reason });
    await interaction.reply({ content: `🔓 تم فتح القناة.\nالسبب: ${reason}\n\nChannel unlocked.\nReason: ${reason}` });
  },
};
