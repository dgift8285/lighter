const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
let currentQR = null;
let botStatus = 'starting...';

app.get('/', async (req, res) => {
  if (botStatus === 'connected') {
    return res.send('<h2>✅ Bot is connected!</h2>');
  }
  if (!currentQR) {
    return res.send('<h2>Waiting for QR code... refresh in a few seconds</h2>');
  }
  const qrImage = await qrcode.toDataURL(currentQR);
  res.send(`<h2>Scan this with WhatsApp</h2><img src="${qrImage}" />`);
});

app.listen(process.env.PORT || 3000, () => console.log('🌐 Web server running'));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) currentQR = qr;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      botStatus = 'reconnecting...';
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      botStatus = 'connected';
      console.log('✅ Bot connected!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const sender = msg.key.remoteJid;
    if (text.trim().toLowerCase() === '!ping') {
      await sock.sendMessage(sender, { text: 'pong 🏓' });
    }
  });
}

startBot();