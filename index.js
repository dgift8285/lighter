const observer = require('./lib/observer');
observer.attach();

const { default: makeWASocket, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const express = require('express');
const P = require('pino');

const botState = require('./lib/state');
const { loadSession } = require('./lib/session');
const { handleMessage } = require('./lib/commands');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  if (botState.botStatus === 'connected') return res.send('<h2>✅ Bot is connected!</h2><p><a href="/logs">View logs</a></p>');
  if (botState.pairingCode) {
    return res.send(`<h2>Your pairing code: ${botState.pairingCode}</h2><p>Enter this in WhatsApp fast.</p><p><a href="/logs">View logs</a></p>`);
  }
  res.send(`
    <h2>Enter your WhatsApp number (country code, no + no spaces no leading 0)</h2>
    <form method="POST" action="/pair">
      <input name="number" placeholder="e.g. 254748548334" />
      <button type="submit">Get Pairing Code</button>
    </form>
    <p><a href="/logs">View logs</a></p>
  `);
});

app.get('/logs', (req, res) => {
  res.type('text/plain').send(observer.getLogs() || 'No logs yet.');
});

app.post('/pair', async (req, res) => {
  const number = req.body.number;
  if (botState.sock && number) {
    try {
      botState.pairingCode = await botState.sock.requestPairingCode(number);
    } catch (e) {
      return res.send('Error generating code: ' + e.message);
    }
  }
  res.redirect('/');
});

app.listen(process.env.PORT || 3000, () => console.log('🌐 Web server running'));

async function startBot() {
  const { state, saveCreds, version } = await loadSession();

  botState.sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    version
  });

  const sock = botState.sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      botState.botStatus = 'reconnecting...';
      botState.pairingCode = null;
      console.log('Connection closed, reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      botState.botStatus = 'connected';
      console.log('✅ Bot connected!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    await handleMessage(sock, m.messages[0]);
  });
}

startBot();