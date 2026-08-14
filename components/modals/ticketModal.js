'use strict';

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const ticketTypes = require('../../config/ticketTypes');
const { createTicket } = require('../../services/ticketService');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../buttons/ticketButtons');
const config = require('../../config/config');

function buildTicketModal(typeId) {
  const ticketType = ticketTypes.find(t => t.id === typeId);
  if (!ticketType) return null;

  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${typeId}`)
    .setTitle(`${ticketType.emoji} ${ticketType.nameAr} / ${ticketType.nameEn}`);

  const questions = ticketType.modalQuestions.slice(0, 5);
  for (const q of questions) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(q.id)
          .setLabel(q.label)
          .setStyle(q.style === 'PARAGRAPH' ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(q.required !== false)
          .setMaxLength(q.maxLength || 1000)
      )
    );
  }

  return modal;
}

async function handleTicketModalSubmit(interaction, client) {
  const typeId = interaction.customId.replace('ticket_modal_', '');
  const ticketType = ticketTypes.find(t => t.id === typeId);
  if (!ticketType) return interaction.reply({ content: '❌ نوع التذكرة غير موجود. / Ticket type not found.', ephemeral: true });

  await interaction.deferReply({ ephemeral: true });

  const subject = interaction.fields.getTextInputValue('subject');
  const description = interaction.fields.getTextInputValue('description');

  try {
    const { ticket, channel } = await createTicket(
      interaction.guild,
      interaction.member,
      ticketType,
      subject,
      description
    );

    // Send opening message with embed and buttons
    const supportRoleId = ticketType.supportRoleOverride || config.roles.support;
    const mentionContent = [
      `<@${interaction.member.id}>`,
      supportRoleId ? `<@&${supportRoleId}>` : null,
    ].filter(Boolean).join(' ');

    const embed = ticketEmbed(ticket, ticketType);
    const components = buildTicketActionRows();

    const openingMsg = await channel.send({ content: mentionContent, embeds: [embed], components });

    // Store opening message ID
    const { query } = require('../../database/database');
    await query(`UPDATE tickets SET opening_message_id=$1 WHERE id=$2`, [openingMsg.id, ticket.id]);

    await interaction.editReply({ content: `✅ تم إنشاء تذكرتك في <#${channel.id}>!\nYour ticket was created in <#${channel.id}>!` });
  } catch (err) {
    if (err.type === 'COOLDOWN') {
      return interaction.editReply({ content: `⏱️ يرجى الانتظار ${err.remaining} ثانية قبل إنشاء تذكرة أخرى.\nPlease wait ${err.remaining}s before creating another ticket.` });
    }
    if (err.type === 'DUPLICATE') {
      return interaction.editReply({ content: `❌ لديك بالفعل تذكرة مفتوحة من هذا النوع.\nYou already have an open ticket of this type.` });
    }
    throw err;
  }
}

function register(registerModalHandler) {
  registerModalHandler('ticket_modal_', handleTicketModalSubmit);
}

module.exports = { buildTicketModal, register };
