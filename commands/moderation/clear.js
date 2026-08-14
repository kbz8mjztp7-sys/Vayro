'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { logModAction } = require('../../services/loggingService');
const { isModerator } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('مسح رسائل من القناة / Delete messages from channel')
    .addIntegerOption(o => o.setName('amount').setDescription('عدد الرسائل (1-100) / Amount (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('user').setDescription('مسح رسائل عضو محدد / Filter by user').setRequired(false)),

  async execute(interaction) {
    if (!isModerator(interaction.member)) return interaction.reply({ content: '❌ المشرفون فقط. / Moderators only.', ephemeral: true });
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');
    await interaction.deferReply({ ephemeral: true });

    let messages = await interaction.channel.messages.fetch({ limit: 100 });
    if (targetUser) messages = messages.filter(m => m.author.id === targetUser.id);

    // Discord only allows bulk-delete for messages younger than 14 days
    const twoWeeks = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const deletable = [...messages.values()].filter(m => m.createdTimestamp > twoWeeks).slice(0, amount);

    let deleted = 0;
    if (deletable.length >= 2) {
      const result = await interaction.channel.bulkDelete(deletable, true);
      deleted = result.size;
    } else if (deletable.length === 1) {
      await deletable[0].delete();
      deleted = 1;
    }

    await logModAction('مسح رسائل / Messages Cleared', { type: 'clear', moderator: interaction.member.id, channel: interaction.channel.id, count: deleted });
    await interaction.editReply({ content: `✅ تم حذف ${deleted} رسالة. / Deleted ${deleted} messages.` });
  },
};
