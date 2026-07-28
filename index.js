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

const SESSION_IDS = Object.keys(botState.sessions);

app.get('/', (req, res) => {
  const links = SESSION_IDS.map(id => `<li><a href="/${id}">${id}</a> — ${botState.sessions[id].status}</li>`).join('');
  res.send(`<h2>Bot Sessions</h2><ul>${links}</ul><p><a href="/logs">View logs</a></p>`);
});

app.get('/logs', (req, res) => {
  res.type('text/plain').send(observer.getLogs() || 'No logs yet.');
});

SESSION_IDS.forEach(id => {
  app.get(`/${id}`, (req, res) => {
    const s = botState.sessions[id];
    if (s.status === 'connected') return res.send(`<h2>✅ ${id} is connected!</h2><p><a href="/">Back</a></p>`);
    if (s.pairingCode) {
      return res.send(`<h2>${id} pairing code: ${s.pairingCode}</h2><p>Enter this in WhatsApp fast.</p><p><a href="/">Back</a></p>`);
    }
    res.send(`
      <h2>${id}: Enter WhatsApp number (country code, no + no spaces no leading 0)</h2>
      <form method="POST" action="/${id}/pair">
        <input name="number" placeholder="e.g. 254748548334" />
        <button type="submit">Get Pairing Code</button>
      </form>
      <p><a href="/">Back</a></p>
    `);
  });

  app.post(`/${id}/pair`, async (req, res) => {
    const number = req.body.number;
    const s = botState.sessions[id];
    if (s.sock && number) {
      try {
        s.pairingCode = await s.sock.requestPairingCode(number);
      } catch (e) {
        return res.send('Error generating code: ' + e.message);
      }
    }
    res.redirect(`/${id}`);
  });
});

app.listen(process.env.PORT || 3000, () => console.log('🌐 Web server running'));

async function startBot(sessionId) {
  const s = botState.sessions[sessionId];
  const { state, saveCreds, version } = await loadSession(sessionId);

  s.sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    version
  });

  const sock = s.sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      s.status = 'reconnecting...';
      s.pairingCode = null;
      console.log(`[${sessionId}] Connection closed, reconnecting:`, shouldReconnect);
      if (shouldReconnect) startBot(sessionId);
    } else if (connection === 'open') {
      s.status = 'connected';
      console.log(`✅ [${sessionId}] Bot connected!`);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];

    if (msg.key?.remoteJid === 'status@broadcast') {
      if (botState.autoViewStatus) {
        try {
          await sock.readMessages([msg.key]);
          console.log(`[${sessionId}] Auto-viewed status from ${msg.key.participant}`);
        } catch (err) {
          console.error(`[${sessionId}] Failed to auto-view status:`, err.message);
        }
      }
      if (botState.autoLikeStatus) {
        try {
          const emoji = botState.autoLikeEmojis[Math.floor(Math.random() * botState.autoLikeEmojis.length)];
          await sock.sendMessage('status@broadcast', {
            react: { text: emoji, key: msg.key }
          }, {
            statusJidList: [msg.key.participant, sock.user.id]
          });
          console.log(`[${sessionId}] Auto-liked status from ${msg.key.participant} with ${emoji}`);
        } catch (err) {
          console.error(`[${sessionId}] Failed to auto-like status:`, err.message);
        }
      }
      return;
    }

    await handleMessage(sock, msg);
  });
}

SESSION_IDS.forEach(id => startBot(id));