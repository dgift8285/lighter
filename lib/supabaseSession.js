const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const AUTH_DIR = path.join(__dirname, '..', 'auth_info');
const SESSION_ID = 'whatsapp';

let supabase = null;

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

async function restoreSession() {
  const client = getClient();
  if (!client) return;

  const { data, error } = await client
    .from('sessions')
    .select('files')
    .eq('id', SESSION_ID)
    .maybeSingle();

  if (error) {
    console.error('Supabase restore error:', error.message);
    return;
  }
  if (!data || !data.files) {
    console.log('No saved session found in Supabase, starting fresh.');
    return;
  }

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  for (const [filename, content] of Object.entries(data.files)) {
    fs.writeFileSync(path.join(AUTH_DIR, filename), content);
  }
  console.log(`Restored ${Object.keys(data.files).length} session file(s) from Supabase.`);
}

async function backupSession() {
  const client = getClient();
  if (!client) return;
  if (!fs.existsSync(AUTH_DIR)) return;

  const filenames = fs.readdirSync(AUTH_DIR);
  const files = {};
  for (const filename of filenames) {
    files[filename] = fs.readFileSync(path.join(AUTH_DIR, filename), 'utf8');
  }

  const { error } = await client
    .from('sessions')
    .upsert({ id: SESSION_ID, files, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Supabase backup error:', error.message);
  }
}

module.exports = { restoreSession, backupSession };