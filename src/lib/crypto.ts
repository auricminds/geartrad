import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// ── AES-256-GCM credential encryption ────────────────────────────────────────
// Used to encrypt game account credentials (email, password, extra info) before
// storing in the DB and to decrypt them for authorised buyers.
//
// Key: CREDENTIALS_ENCRYPTION_KEY env var — 64-char hex string (32 bytes).
// Envelope format: <iv_hex>:<authTag_hex>:<ciphertext_hex>

const ALGO = 'aes-256-gcm';
const ENVELOPE_RE = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;

function getKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'CREDENTIALS_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

/** Returns true if the value looks like an encrypted envelope. */
export function isEncryptedEnvelope(value: string): boolean {
  return ENVELOPE_RE.test(value);
}

/** Encrypts a plaintext string. Returns a colon-delimited envelope. */
export function encryptCredential(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/** Decrypts an envelope produced by encryptCredential. */
export function decryptCredential(envelope: string): string {
  const key = getKey();
  const parts = envelope.split(':');
  if (parts.length !== 3) throw new Error('Invalid credential envelope');
  const [ivHex, tagHex, ctHex] = parts;
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(ctHex, 'hex', 'utf8') + decipher.final('utf8');
}

/**
 * Safely decrypt a stored value.
 * - If the value is null/undefined, returns null.
 * - If it looks like a plaintext (not an envelope), returns it as-is (migration safety).
 * - Otherwise decrypts and returns the plaintext.
 */
export function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!isEncryptedEnvelope(value)) return value; // plaintext row from before migration
  return decryptCredential(value);
}
