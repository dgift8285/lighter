const path = require('path');
const fs = require('fs');
const botState = require('../state');
const { formatUptime } = require('../commandHelpers');

const MENU_TEXT = `*🤖 Bot Menu*\n\n` +
  `*Media Downloads*\n!yt <url>\n!ytmp3 <url>\n!tiktok <url>\n!ig <url>\n\n` +
  `*Fun / Anime*\n!hug !pat !kiss !cry !dance !slap !cuddle !wink !highfive !kill\n\n` +
  `*Owner*\n!ping !alive !time !say <text>`;

const MENU_VIDEO_PATH = path.join(__dirname, '..', '..', 'assets', 'menu.mp4');

async function sendMenu(sock, sender) {
  if (fs.existsSync(MENU_VIDEO_PATH)) {
    await sock.sendMessage(sender, {
      video: fs.readFileSync(MENU_VIDEO_PATH),
      caption: MENU_TEXT
    });
  } else {
    await sock.sendMessage(sender, { text: MENU_TEXT });
  }
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