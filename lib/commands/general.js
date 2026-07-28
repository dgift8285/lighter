const path = require('path');
const fs = require('fs');
const botState = require('../state');
const { formatUptime } = require('../commandHelpers');

function box(title, items) {
  return `┌──⌈ \`${title}\` ⌋\n` +
    items.map(i => `│ ${i}`).join('\n') +
    `\n└───────────────`;
}

function buildMenu() {
  return box('MEDIA DOWNLOADS', ['yt <url>', 'ytmp3 <url>', 'tiktok <url>', 'ig <url>']) + '\n\n' +
    box('FUN / ANIME', ['hug', 'pat', 'kiss', 'cry', 'dance', 'slap', 'cuddle', 'wink', 'highfive', 'kill']) + '\n\n' +
    box('AI', ['ai <question>']) + '\n\n' +
    box('OWNER', ['ping', 'alive', 'time', 'say <text>']) + '\n\n' +
    box('SETTINGS', ['autoviewstatus on|off', 'autolikestatus on|off']) + '\n\n' +
    box('GENERAL', ['menu', 'help']) + '\n\n' +
    `🤖 *Bot Menu* • prefix: [ ! ]`;
}

const MENU_VIDEO_PATH = path.join(__dirname, '..', 'assets', 'menu.mp4');

async function sendMenu(sock, sender) {
  const MENU_TEXT = buildMenu();
  const exists = fs.existsSync(MENU_VIDEO_PATH);

  if (exists) {
    try {
      const buffer = fs.readFileSync(MENU_VIDEO_PATH);
      await sock.sendMessage(sender, {
        video: buffer,
        mimetype: 'video/mp4',
        gifPlayback: true,
        caption: MENU_TEXT
      });
      return;
    } catch (err) {
      console.error('Failed to send menu video:', err.message);
    }
  }

  await sock.sendMessage(sender, { text: MENU_TEXT });
}

module.exports = {
  '!menu': async (sock, sender) => sendMenu(sock, sender),
  '!help': async (sock, sender) => sendMenu(sock, sender),
  '!ping': async (sock, sender, args, ctx) => {
    if (!ctx.isOwner) return;
    await sock.sendMessage(sender, { text: 'pong 🏓' });
  },
  '!alive': async (sock, sender, args, ctx) => {
    if (!ctx.isOwner) return;
    await sock.sendMessage(sender, { text: `✅ Alive\nUptime: ${formatUptime(Date.now() - botState.startTime)}` });
  },
  '!time': async (sock, sender, args, ctx) => {
    if (!ctx.isOwner) return;
    await sock.sendMessage(sender, { text: `🕐 ${new Date().toString()}` });
  }
};