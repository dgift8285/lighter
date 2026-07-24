const { useMultiFileAuthState, fetchLatestWaWebVersion } = require('@whiskeysockets/baileys');

async function loadSession() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestWaWebVersion();
  return { state, saveCreds, version };
}

module.exports = { loadSession };