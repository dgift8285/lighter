const axios = require('axios');

module.exports = {
  '!ai': async (sock, sender, args) => {
    const question = args.join(' ');
    if (!question) return sock.sendMessage(sender, { text: 'Usage: !ai <your question>' });

    await sock.sendMessage(sender, { text: '🤔 Thinking...' });

    try {
      const { data } = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(question)}`, {
        params: { model: 'mistral' },
        timeout: 30000
      });
      const reply = typeof data === 'string' ? data : JSON.stringify(data);
      await sock.sendMessage(sender, { text: reply.slice(0, 4000) });
    } catch (err) {
      const status = err.response?.status;
      console.error('AI chat error:', status, err.message);

      if (status === 429) {
        await sock.sendMessage(sender, { text: '⏳ Too many requests right now, wait a few seconds and try again.' });
      } else if (status === 402) {
        await sock.sendMessage(sender, { text: '⚠️ That AI model needs payment now on the free API — trying a different one might be needed.' });
      } else {
        await sock.sendMessage(sender, { text: '⚠️ Could not get a response right now, try again.' });
      }
    }
  }
};