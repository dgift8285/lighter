const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));

let sock = null;
let pairingCode = null;
let botStatus = 'starting...';

app.get('/', (req, res) => {
  if (botStatus === 'connected') {
    return res.send('<h2>✅ Bot is connected!</h2>');
  }
  if (pairingCode) {
    return res.send(`<h2>Your pairing code: ${pairingCode}</h2><p>Enter this in WhatsApp → Linked Devices → Link with phone number</p>`);
  }
  res.send(`
    <h2>Enter your WhatsApp number (with country code, no + or spaces)</h2>
    <form method="POST" action="/pair">
      <input name="number" placeholder="e.g. 254712345678" />
      <button type="submit">Get Pairing Code</button>
    </form>
  `);
});

app.post('/pair', async (req, res) => {
  const number = req.body.number;
  if (sock && number) {
    try {
      const code = await sock.requestPairingCode(number);
      pairingCode = code;
    } catch (e) {
      return res.send('Error generating code, try again: ' + e.message);
    }
  }
  res.redirect('/');
});

app.listen(process.env.PORT || 3000, () => console.log('🌐 Web server running'));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      botStatus = 'reconnecting...';
      pairingCode = null;
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