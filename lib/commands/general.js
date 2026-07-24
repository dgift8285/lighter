const path = require('path');
const fs = require('fs');
const botState = require('../state');
const { formatUptime } = require('../commandHelpers');

const MENU_TEXT = `*🤖 Bot Menu*\n\n` +
  `*Media Downloads*\n!yt <url> - YouTube video\n!ytmp3 <url> - YouTube audio\n!tiktok <url> - TikTok video\n!ig <url> - Instagram media\n\n` +
  `*Fun / Anime*\n!hug !pat !kiss !cry !dance !slap !cuddle !wink !highfive !kill\n\n` +
  `*AI*\n!ai <question> - ask the AI anything\n\n` +
  `*Owner*\n!ping !alive !time !say <text>\n\n` +
  `*General*\n!menu / !help - show this menu`;

const MENU_VIDEO_PATH = path.join(__dirname, '..', 'assets', 'menu.mp4');

async function sendMenu(sock, sender) {
  const exists = fs.existsSync(MENU_VIDEO_PATH);
  console.log(`Menu video check: ${MENU_VIDEO_PATH} exists=${exists}`);

  if (exists) {
    try {
      const stats = fs.statSync(MENU_VIDEO_PATH);
      console.log(`Menu video size: ${stats.size} bytes`);

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