'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { addAutoReply } = require('../../services/autoReplyService');
const { logConfigChange } = require('../../services/loggingService');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoreply-add')
    .setDescription('إضافة رد تلقائي / Add an auto-reply')
    .setDefaultMemberPermissions(0x8)
    .addStringOption(o => o.setName('trigger').setDescription('نص التشغيل / Trigger text').setRequired(true).setMaxLength(200))
    .addStringOption(o => o.setName('response').setDescription('نص الرد / Response text').setRequired(true).setMaxLength(2000))
    .addStringOption(o => o.setName('matchtype').setDescription('نوع المطابقة / Match type').setRequired(false)
      .addChoices(
        { name: 'contains (يحتوي)', value: 'contains' },
        { name: 'exact (مطابق تام)', value: 'exact' },
        { name: 'starts_with (يبدأ بـ)', value: 'starts_with' },
      ))
    .addChannelOption(o => o.setName('channel').setDescription('تقييد لقناة معينة / Restrict to channel').setRequired(false))
    .addIntegerOption(o => o.setName('cooldown').setDescription('زمن الانتظار بالثواني / Cooldown in seconds').setMinValue(0).setMaxValue(3600).setRequired(false)),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ المديرون فقط. / Admins only.', ephemeral: true });
    const trigger = interaction.options.getString('trigger');
    const response = interaction.options.getString('response');
    const matchType = interaction.options.getString('matchtype') || 'contains';
    const channel = interaction.options.getChannel('channel');
    const cooldown = interaction.options.getInteger('cooldown') ?? 30;
    await interaction.deferReply({ ephemeral: true });

    try {
      const reply = await addAutoReply(interaction.guild.id, trigger, response, matchType, interaction.member.id, channel?.id, null, cooldown);
      await logConfigChange('إضافة رد تلقائي / Auto-reply Added', { performer: interaction.member.id, details: `ID #${reply.id}: trigger="${trigger}"` });
      await interaction.editReply({ content: `✅ تمت إضافة الرد التلقائي #${reply.id}. / Auto-reply #${reply.id} added.\nالتشغيل: \`${trigger}\`\nنوع المطابقة: ${matchType}` });
    } catch (err) {
      if (err.type === 'DUPLICATE') return interaction.editReply({ content: `❌ هذا النص التشغيلي موجود بالفعل. / Trigger already exists.` });
      throw err;
    }
  },
};
