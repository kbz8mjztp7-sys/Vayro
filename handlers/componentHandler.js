'use strict';

const { handleInteractionError } = require('./errorHandler');

// Component handlers registry
const buttonHandlers = new Map();
const modalHandlers = new Map();
const selectMenuHandlers = new Map();

function registerButtonHandler(customIdPrefix, handler) {
  buttonHandlers.set(customIdPrefix, handler);
}

function registerModalHandler(customIdPrefix, handler) {
  modalHandlers.set(customIdPrefix, handler);
}

function registerSelectMenuHandler(customIdPrefix, handler) {
  selectMenuHandlers.set(customIdPrefix, handler);
}

function findHandler(map, customId) {
  // Exact match first
  if (map.has(customId)) return map.get(customId);
  // Prefix match
  for (const [prefix, handler] of map.entries()) {
    if (customId.startsWith(prefix)) return handler;
  }
  return null;
}

async function handleButton(interaction, client) {
  const handler = findHandler(buttonHandlers, interaction.customId);
  if (!handler) {
    console.warn(`[COMPONENT] No button handler for: ${interaction.customId}`);
    return;
  }
  try {
    await handler(interaction, client);
  } catch (err) {
    await handleInteractionError(interaction, err);
  }
}

async function handleModal(interaction, client) {
  const handler = findHandler(modalHandlers, interaction.customId);
  if (!handler) {
    console.warn(`[COMPONENT] No modal handler for: ${interaction.customId}`);
    return;
  }
  try {
    await handler(interaction, client);
  } catch (err) {
    await handleInteractionError(interaction, err);
  }
}

async function handleSelectMenu(interaction, client) {
  const handler = findHandler(selectMenuHandlers, interaction.customId);
  if (!handler) {
    console.warn(`[COMPONENT] No select menu handler for: ${interaction.customId}`);
    return;
  }
  try {
    await handler(interaction, client);
  } catch (err) {
    await handleInteractionError(interaction, err);
  }
}

function loadComponents(client) {
  // Load all component handlers
  require('../components/buttons/ticketButtons').register(registerButtonHandler);
  require('../components/selectMenus/ticketSelect').register(registerSelectMenuHandler);
  require('../components/selectMenus/helpSelect').register(registerSelectMenuHandler);
  require('../components/selectMenus/transferSelect').register(registerSelectMenuHandler);
  require('../components/modals/ticketModal').register(registerModalHandler);
  console.log('[COMPONENTS] ✅ All component handlers registered.');
}

module.exports = {
  handleButton,
  handleModal,
  handleSelectMenu,
  loadComponents,
  registerButtonHandler,
  registerModalHandler,
  registerSelectMenuHandler,
};
