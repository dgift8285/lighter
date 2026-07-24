const botState = require('../state');
const { formatUptime } = require('../commandHelpers');

const MENU_TEXT = `*🤖 Bot Menu*\n\n` +
  `*Media Downloads*\n!yt <url>\n!ytmp3 <url>\n!tiktok <url>\n!ig <url>\n\n` +
  `*Fun / Anime*\n!hug !pat !kiss !cry !dance !slap !cuddle !wink !highfive !kill\n\n` +
  `*Owner*\n!ping !alive !time !say <text>`;

module.exports = {
  '!menu': async (sock, sender) => sock.sendMessage(sender, { text: MENU_TEXT }),
  '!help': async (sock, sender) => sock.sendMessage(sender, { text: MENU_TEXT }),
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