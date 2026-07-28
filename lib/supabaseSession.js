const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabase = null;

function getAuthDir(sessionId) {
  return path.join(__dirname, '..', `auth_info_${sessionId}`);
}

function getClient() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
    return null;
  }
  supabase = createClient(url, key);
  return supabase;
}

async function restoreSession(sessionId) {
  const client = getClient();
  if (!client) return;
  const authDir = getAuthDir(sessionId);

  const { data, error } = await client
    .from('sessions')
    .select('files')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    console.error(`Supabase restore error (${sessionId}):`, error.message);
    return;
  }
  if (!data || !data.files) {
    console.log(`No saved session found for ${sessionId}, starting fresh.`);
    return;
  }

  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  for (const [filename, content] of Object.entries(data.files)) {
    fs.writeFileSync(path.join(authDir, filename), content);
  }
  console.log(`Restored ${Object.keys(data.files).length} file(s) for ${sessionId} from Supabase.`);
}

async function backupSession(sessionId) {
  const client = getClient();
  if (!client) return;
  const authDir = getAuthDir(sessionId);
  if (!fs.existsSync(authDir)) return;

  const filenames = fs.readdirSync(authDir);
  const files = {};
  for (const filename of filenames) {
    files[filename] = fs.readFileSync(path.join(authDir, filename), 'utf8');
  }

  const { error } = await client
    .from('sessions')
    .upsert({ id: sessionId, files, updated_at: new Date().toISOString() });

  if (error) {
    console.error(`Supabase backup error (${sessionId}):`, error.message);
  }
}

module.exports = { restoreSession, backupSession, getAuthDir };