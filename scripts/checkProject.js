'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let errors = 0;
let warnings = 0;

function check(condition, msg, isWarning = false) {
  if (!condition) {
    if (isWarning) { console.warn(`  ⚠️  WARN: ${msg}`); warnings++; }
    else { console.error(`  ❌ FAIL: ${msg}`); errors++; }
  } else {
    console.log(`  ✅ OK:   ${msg}`);
  }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function dirExists(rel) { return fs.existsSync(path.join(ROOT, rel)) && fs.statSync(path.join(ROOT, rel)).isDirectory(); }

console.log('\n╔══════════════════════════════════════╗');
console.log('║  Vyro Management System — Check      ║');
console.log('╚══════════════════════════════════════╝\n');

// Required files
console.log('📁 Required Files:');
const requiredFiles = [
  'index.js', 'package.json', '.env.example',
  'config/config.js', 'config/ticketTypes.js',
  'database/database.js', 'database/migrations.js',
  'web/healthServer.js',
  'handlers/commandHandler.js', 'handlers/eventHandler.js',
  'handlers/componentHandler.js', 'handlers/errorHandler.js',
  'events/ready.js', 'events/interactionCreate.js',
  'events/messageCreate.js', 'events/guildMemberAdd.js', 'events/guildMemberRemove.js',
  'services/ticketService.js', 'services/moderationService.js',
  'services/transcriptService.js', 'services/autoReplyService.js', 'services/loggingService.js',
  'utils/permissions.js', 'utils/embeds.js', 'utils/cooldowns.js',
  'utils/sanitizers.js', 'utils/constants.js',
  'components/buttons/ticketButtons.js',
  'components/modals/ticketModal.js',
  'components/selectMenus/ticketSelect.js',
  'scripts/deployCommands.js',
];
for (const f of requiredFiles) check(fileExists(f), f);

// package.json validity
console.log('\n📦 package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  check(pkg.name, 'has name field');
  check(pkg.scripts && pkg.scripts.start, 'has "start" script');
  check(pkg.scripts && pkg.scripts.deploy, 'has "deploy" script');
  check(pkg.scripts && pkg.scripts.check, 'has "check" script');
  check(pkg.dependencies && pkg.dependencies['discord.js'], 'discord.js in dependencies');
  check(pkg.dependencies && pkg.dependencies['express'], 'express in dependencies');
  check(pkg.dependencies && pkg.dependencies['pg'], 'pg in dependencies');
} catch (err) { check(false, `package.json is valid JSON: ${err.message}`); }

// Command files
console.log('\n⌨️  Commands:');
const commandNames = new Set();
const commandDirs = ['general', 'tickets', 'moderation', 'configuration'];
for (const dir of commandDirs) {
  const dirPath = path.join(ROOT, 'commands', dir);
  if (!fs.existsSync(dirPath)) { check(false, `commands/${dir}/ exists`); continue; }
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
  check(files.length > 0, `commands/${dir}/ has commands (${files.length} files)`);
  for (const file of files) {
    try {
      const cmd = require(path.join(dirPath, file));
      check(cmd.data && cmd.data.name, `${dir}/${file}: has data.name`);
      check(typeof cmd.execute === 'function', `${dir}/${file}: has execute function`);
      if (cmd.data && cmd.data.name) {
        check(!commandNames.has(cmd.data.name), `No duplicate command name: /${cmd.data.name}`);
        commandNames.add(cmd.data.name);
      }
    } catch (err) { check(false, `${dir}/${file} loads without error: ${err.message}`); }
  }
}

// Event files
console.log('\n📡 Events:');
const eventFiles = fs.readdirSync(path.join(ROOT, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  try {
    const evt = require(path.join(ROOT, 'events', file));
    check(evt.name, `${file}: has name`);
    check(typeof evt.execute === 'function', `${file}: has execute`);
  } catch (err) { check(false, `${file} loads: ${err.message}`); }
}

// Dependencies installed
console.log('\n📚 Dependencies:');
const nodeModules = path.join(ROOT, 'node_modules');
check(dirExists('node_modules'), 'node_modules/ exists (npm install has been run)');
['discord.js', 'express', 'pg'].forEach(dep => {
  check(fs.existsSync(path.join(nodeModules, dep)), `${dep} is installed`);
});

// Environment variable documentation
console.log('\n🔑 Required Secrets (names only — do not set values here):');
const requiredSecrets = ['DISCORD_TOKEN', 'CLIENT_ID', 'DATABASE_URL'];
const optionalSecrets = ['GUILD_ID', 'OWNER_ID', 'ADMIN_ROLE_ID', 'MANAGEMENT_ROLE_ID', 'SUPPORT_ROLE_ID', 'MODERATOR_ROLE_ID'];
for (const s of requiredSecrets) check(true, `${s} — REQUIRED (add to Replit Secrets)`, false);
for (const s of optionalSecrets) check(true, `${s} — optional but recommended`, false);

// Summary
console.log('\n══════════════════════════════════════');
if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! The project is ready.');
} else {
  console.log(`Results: ${errors} error(s), ${warnings} warning(s)`);
  if (errors > 0) process.exit(1);
}
