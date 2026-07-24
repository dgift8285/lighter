const axios = require('axios');
const botState = require('./state');

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
}

function isOwner(senderNumber, msgKeyFromMe) {
  return senderNumber === botState.OWNER_NUMBER || msgKeyFromMe;
}

async function sendReaction(sock, sender, type, attempt = 1) {
  try {
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${type}`, { timeout: 10000 });
    await sock.sendMessage(sender, { image: { url: data.url }, caption: `${type} 💫` });
  } catch (e) {
    console.error(`Reaction fetch failed (attempt ${attempt}):`, e.message);
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 1500));
      return sendReaction(sock, sender, type, attempt + 1);
    }
    await sock.sendMessage(sender, { text: `Couldn't fetch ${type} right now, try again in a moment.` });
  }
}

module.exports = { formatUptime, isOwner, sendReaction };