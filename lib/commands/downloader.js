const axios = require('axios');
const { instagramGetUrl } = require('instagram-url-direct');

const MAXXTECH_BASE = 'https://api.maxxtech.co.ke/maxxtech';
const MAXXTECH_APIKEY = 'carlymaxx';

async function maxxtechFetch(url, type) {
  try {
    const { data } = await axios.get(MAXXTECH_BASE, {
      params: { url, type, apikey: MAXXTECH_APIKEY }
    });
    if (!data.success) throw new Error(data.message || 'API returned failure');
    return data.data;
  } catch (err) {
    if (err.response) {
      console.error('Maxxtech API error:', err.response.status, JSON.stringify(err.response.data));
      throw new Error(`API error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    }
    console.error('Maxxtech request failed:', err.message);
    throw err;
  }
}

module.exports = {
  '!yt': async (sock, sender, args) => {
    const url = args.join(' ');
    if (!url) return sock.sendMessage(sender, { text: 'Usage: !yt <youtube link>' });
    await sock.sendMessage(sender, { text: '⏳ Fetching video...' });

    const result = await maxxtechFetch(url, 'mp4');
    const best = result.formats.find(f => f.quality === '720p') || result.formats[result.formats.length - 1];

    await sock.sendMessage(sender, {
      video: { url: best.url },
      caption: `${result.title}\n${best.quality} • ${best.size_human}`
    });
  },

  '!ytmp3': async (sock, sender, args) => {
    const url = args.join(' ');
    if (!url) return sock.sendMessage(sender, { text: 'Usage: !ytmp3 <youtube link>' });
    await sock.sendMessage(sender, { text: '⏳ Fetching audio...' });

    const result = await maxxtechFetch(url, 'mp3');
    const audioFormat = result.formats[0];

    await sock.sendMessage(sender, {
      audio: { url: audioFormat.url },
      mimetype: 'audio/mp4',
      fileName: `${result.title}.mp3`
    });
  },

  '!tiktok': async (sock, sender, args) => {
    const url = args.join(' ');
    if (!url) return sock.sendMessage(sender, { text: 'Usage: !tiktok <tiktok link>' });
    await sock.sendMessage(sender, { text: '⏳ Fetching TikTok...' });

    const { data } = await axios.get('https://www.tikwm.com/api/', { params: { url } });
    if (data?.data?.play) {
      await sock.sendMessage(sender, { video: { url: data.data.play }, caption: data.data.title || 'TikTok' });
    } else {
      await sock.sendMessage(sender, { text: '❌ Could not fetch that TikTok link.' });
    }
  },

  '!ig': async (sock, sender, args) => {
    const url = args.join(' ');
    if (!url) return sock.sendMessage(sender, { text: 'Usage: !ig <instagram link>' });
    await sock.sendMessage(sender, { text: '⏳ Fetching Instagram media...' });

    const result = await instagramGetUrl(url);
    const media = result?.url_list?.[0];
    if (media) {
      await sock.sendMessage(sender, { video: { url: media } });
    } else {
      await sock.sendMessage(sender, { text: '❌ Could not fetch that Instagram link.' });
    }
  }
};