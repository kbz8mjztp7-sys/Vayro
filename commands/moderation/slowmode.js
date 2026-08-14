'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { logModAction } = require('../../services/loggingService');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('تعيين وضع التأخير في القناة / Set channel slowmode')
    .addIntegerOption(o => o.setName('seconds').setDescription('الثواني (0 لإلغاء) / Seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const seconds = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(seconds);
    await logModAction('تعيين وضع التأخير / Slowmode Set', { type: 'slowmode', moderator: interaction.member.id, channel: interaction.channel.id, count: seconds });
    const msg = seconds === 0 ? '✅ تم إلغاء وضع التأخير. / Slowmode disabled.' : `✅ تم تعيين وضع التأخير إلى ${seconds} ثانية. / Slowmode set to ${seconds}s.`;
    await interaction.reply({ content: msg, ephemeral: true });
  },
};
