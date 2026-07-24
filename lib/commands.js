const { isOwner } = require('./commandHelpers');

const general = require('./commands/general');
const admin = require('./commands/admin');
const downloader = require('./commands/downloader');
const tools = require('./commands/tools');
const group = require('./commands/group');
const settings = require('./commands/settings');

const registry = { ...general, ...admin, ...downloader, ...tools, ...group, ...settings };

async function handleMessage(sock, msg) {
  if (!msg.message) return;

  const sender = msg.key.remoteJid;
  const senderNumber = sender.split('@')[0];
  const ownerFlag = isOwner(senderNumber, msg.key.fromMe);

  const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
  if (!text) return;

  const [cmdRaw, ...args] = text.split(' ');
  const cmd = cmdRaw.toLowerCase();

  console.log(`Message from ${senderNumber}: ${text}`);

  const handler = registry[cmd];
  if (!handler) return;

  try {
    await handler(sock, sender, args, { isOwner: ownerFlag });
  } catch (err) {
    console.error('Command error:', err.message);
    await sock.sendMessage(sender, { text: '⚠️ Something went wrong running that command.' });
  }
}

module.exports = { handleMessage };