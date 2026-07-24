const ytdl = require('@distube/ytdl-core');
const axios = require('axios');
const { instagramGetUrl } = require('instagram-url-direct');

module.exports = {
  '!yt': async (sock, sender, args) => {
    const url = args.join(' ');
    if (!url) return sock.sendMessage(sender, { text: 'Usage: !yt <youtube link>' });
    await sock.sendMessage(sender, { text: '⏳ Downloading video...' });
    const info = await ytdl.getInfo(url);
    const stream = ytdl(url, { quality: 'lowest', filter: 'audioandvideo' });
    await sock.sendMessage(sender, { video: { stream }, caption: info.videoDetails.title });
  },
  '!ytmp3': async (sock, sender, args) => {
    const url = args.join(' ');
    if (!url) return sock.sendMessage(sender, { text: 'Usage: !ytmp3 <youtube link>' });
    await sock.sendMessage(sender, { text: '⏳ Downloading audio...' });
    const info = await ytdl.getInfo(url);
    const stream = ytdl(url, { filter: 'audioonly' });
    await sock.sendMessage(sender, { audio: { stream }, mimetype: 'audio/mp4', fileName: `${info.videoDetails.title}.mp3` });
  },
  '!tiktok': async (sock, sender, args) => {
    const url = args.join(' ');
    if (!url) return sock.sendMessage(sender, { text: 'Usage: !tiktok <tiktok link>' });
    await sock.sendMessage(sender, { text: '⏳ Fetching TikTok...' });
    const { data } = await axios.get(`https://www.tikwm.com/api/`, { params: { url } });
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