/**
 * One-time migration: encrypt plaintext account credentials in the listings table.
 * Safe to run multiple times — skips already-encrypted rows (envelope detection).
 *
 * Usage:
 *   node scripts/encrypt-existing-credentials.mjs
 *
 * Requires .env.local to have:
 *   CREDENTIALS_ENCRYPTION_KEY  (64-char hex, 32 bytes)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { createCipheriv, randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')];
    })
);

const KEY_HEX = env.CREDENTIALS_ENCRYPTION_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY_HEX || KEY_HEX.length !== 64) {
  console.error('❌  CREDENTIALS_ENCRYPTION_KEY must be a 64-char hex string');
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const key = Buffer.from(KEY_HEX, 'hex');
const ENVELOPE_RE = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;

function isEnvelope(v) { return typeof v === 'string' && ENVELOPE_RE.test(v); }

function encrypt(plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: rows, error } = await db
  .from('listings')
  .select('id, account_email, account_password, account_extra_info')
  .or('account_email.not.is.null,account_password.not.is.null');

if (error) { console.error('❌  Fetch failed:', error.message); process.exit(1); }
if (!rows || rows.length === 0) { console.log('✅  No rows to migrate.'); process.exit(0); }

console.log(`Found ${rows.length} listing(s) with credentials.`);
let updated = 0, skipped = 0;

for (const row of rows) {
  const alreadyDone = [row.account_email, row.account_password, row.account_extra_info]
    .filter(Boolean)
    .every(isEnvelope);

  if (alreadyDone) { skipped++; continue; }

  const patch = {};
  if (row.account_email      && !isEnvelope(row.account_email))      patch.account_email      = encrypt(row.account_email);
  if (row.account_password   && !isEnvelope(row.account_password))   patch.account_password   = encrypt(row.account_password);
  if (row.account_extra_info && !isEnvelope(row.account_extra_info)) patch.account_extra_info = encrypt(row.account_extra_info);

  if (Object.keys(patch).length === 0) { skipped++; continue; }

  const { error: upErr } = await db.from('listings').update(patch).eq('id', row.id);
  if (upErr) {
    console.error(`❌  Failed to update ${row.id}:`, upErr.message);
  } else {
    updated++;
    console.log(`  ✅  Encrypted row ${row.id}`);
  }
}

console.log(`\nDone — ${updated} encrypted, ${skipped} already done/skipped.`);
