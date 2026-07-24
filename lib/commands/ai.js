const axios = require('axios');

module.exports = {
  '!ai': async (sock, sender, args) => {
    const question = args.join(' ');
    if (!question) return sock.sendMessage(sender, { text: 'Usage: !ai <your question>' });

    await sock.sendMessage(sender, { text: '🤔 Thinking...' });

    try {
      const { data } = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(question)}`, {
        params: { model: 'openai' },
        timeout: 30000
      });
      const reply = typeof data === 'string' ? data : JSON.stringify(data);
      await sock.sendMessage(sender, { text: reply.slice(0, 4000) });
    } catch (err) {
      console.error('AI chat error:', err.message);
      await sock.sendMessage(sender, { text: '⚠️ Could not get a response right now, try again.' });
    }
  }
};