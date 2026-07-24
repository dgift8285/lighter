const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
  Browsers
} = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');
const { instagramGetUrl } = require('instagram-url-direct');

const app = express();
app.use(express.urlencoded({ extended: true }));

let sock = null;
let pairingCode = null;
let botStatus = 'starting...';
const startTime = Date.now();

const OWNER_NUMBER = '254748548334'; // your number, no + no spaces

// ---- Web server (pairing + status page) ----
app.get('/', (req, res) => {
  if (botStatus === 'connected') return res.send('<h2>✅ Bot is connected!</h2>');
  if (pairingCode) {
    return res.send(`<h2>Your pairing code: ${pairingCode}</h2><p>Enter this in WhatsApp fast.</p>`);
  }
  res.send(`
    <h2>Enter your WhatsApp number (country code, no + no spaces no leading 0)</h2>
    <form method="POST" action="/pair">
      <input name="number" placeholder="e.g. 254748548334" />
      <button type="submit">Get Pairing Code</button>
    </form>
  `);
});

app.post('/pair', async (req, res) => {
  const number = req.body.number;
  if (sock && number) {
    try {
      pairingCode = await sock.requestPairingCode(number);
    } catch (e) {
      return res.send('Error generating code: ' + e.message);
    }
  }
  res.redirect('/');
});

app.listen(process.env.PORT || 3000, () => console.log('🌐 Web server running'));

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
}

// ---- Anime/fun reaction GIFs (waifu.pics public API, no key needed) ----
const REACTIONS = ['hug', 'pat', 'kiss', 'cry', 'dance', 'slap', 'cuddle', 'wink', 'highfive', 'kill'];

async function sendReaction(sock, sender, type) {
  try {
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${type}`);
    await sock.sendMessage(sender, { image: { url: data.url }, caption: `${type} 💫` });
  } catch (e) {
    await sock.sendMessage(sender, { text: `Couldn't fetch ${type} right now, try again.` });
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestWaWebVersion();

  sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    version
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
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];
    const isOwner = senderNumber === OWNER_NUMBER || msg.key.fromMe;

    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
    const lower = text.toLowerCase();
    const [cmd, ...args] = text.split(' ');
    const cmdLower = cmd.toLowerCase();
    const argText = args.join(' ');

    try {
      // ---- Owner-only utility commands ----
      if (isOwner && lower === '!ping') {
        await sock.sendMessage(sender, { text: 'pong 🏓' });
      } else if (isOwner && lower === '!alive') {
        await sock.sendMessage(sender, { text: `✅ Alive\nUptime: ${formatUptime(Date.now() - startTime)}` });
      } else if (isOwner && lower === '!time') {
        await sock.sendMessage(sender, { text: `🕐 ${new Date().toString()}` });
      } else if (isOwner && lower.startsWith('!say ')) {
        await sock.sendMessage(sender, { text: text.slice(5) });
      }

      // ---- Menu (public) ----
      else if (lower === '!menu' || lower === '!help') {
        const menuText = `*🤖 Bot Menu*\n\n` +
          `*Media Downloads*\n!yt <url> - download YouTube video\n!ytmp3 <url> - download YouTube audio\n!tiktok <url> - download TikTok (no watermark)\n!ig <url> - download Instagram post/reel\n\n` +
          `*Fun / Anime*\n!hug !pat !kiss !cry !dance !slap !cuddle !wink !highfive !kill - reaction gifs\n\n` +
          `*Owner*\n!ping !alive !time !say <text>`;
        await sock.sendMessage(sender, { text: menuText });
      }

      // ---- YouTube video ----
      else if (cmdLower === '!yt' && argText) {
        await sock.sendMessage(sender, { text: '⏳ Downloading video...' });
        const info = await ytdl.getInfo(argText);
        const stream = ytdl(argText, { quality: 'lowest', filter: 'audioandvideo' });
        await sock.sendMessage(sender, { video: { stream }, caption: info.videoDetails.title });
      }

      // ---- YouTube audio ----
      else if (cmdLower === '!ytmp3' && argText) {
        await sock.sendMessage(sender, { text: '⏳ Downloading audio...' });
        const info = await ytdl.getInfo(argText);
        const stream = ytdl(argText, { filter: 'audioonly' });
        await sock.sendMessage(sender, { audio: { stream }, mimetype: 'audio/mp4', fileName: `${info.videoDetails.title}.mp3` });
      }

      // ---- TikTok ----
      else if (cmdLower === '!tiktok' && argText) {
        await sock.sendMessage(sender, { text: '⏳ Fetching TikTok...' });
        const { data } = await axios.get(`https://www.tikwm.com/api/`, { params: { url: argText } });
        if (data?.data?.play) {
          await sock.sendMessage(sender, { video: { url: data.data.play }, caption: data.data.title || 'TikTok' });
        } else {
          await sock.sendMessage(sender, { text: '❌ Could not fetch that TikTok link.' });
        }
      }

      // ---- Instagram ----
      else if (cmdLower === '!ig' && argText) {
        await sock.sendMessage(sender, { text: '⏳ Fetching Instagram media...' });
        const result = await instagramGetUrl(argText);
        const media = result?.url_list?.[0];
        if (media) {
          await sock.sendMessage(sender, { video: { url: media } });
        } else {
          await sock.sendMessage(sender, { text: '❌ Could not fetch that Instagram link.' });
        }
      }

      // ---- Anime/fun reactions ----
      else if (REACTIONS.includes(cmdLower.replace('!', ''))) {
        await sendReaction(sock, sender, cmdLower.replace('!', ''));
      }

    } catch (err) {
      console.error('Command error:', err.message);
      await sock.sendMessage(sender, { text: '⚠️ Something went wrong running that command.' });
    }
  });
}

startBot();