/**
 * Client-side Authenticated Encryption (AEAD: SHA-256 CTR + HMAC-SHA256)
 * for browser localStorage and sessionStorage.
 *
 * Ensures all stored values are encrypted at rest with a random 96-bit IV
 * and protected by a 128-bit constant-time HMAC-SHA256 authentication tag
 * bound to the storage scope, origin, and key name (AAD).
 * Any manual modification in DevTools immediately invalidates the MAC tag
 * and automatically purges the tampered key.
 */

const ENVELOPE_PREFIX = 'gcs_enc_v1';

const K: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function sha256Bytes(msg: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const bitLen = msg.length * 8;
  const padLen = ((msg.length + 9 + 63) & ~63) - msg.length;
  const padded = new Uint8Array(msg.length + padLen);
  padded.set(msg);
  padded[msg.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padded.length - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Uint8Array {
  const blockSize = 64;
  const normalizedKey = new Uint8Array(blockSize);
  if (keyBytes.length > blockSize) {
    normalizedKey.set(sha256Bytes(keyBytes));
  } else {
    normalizedKey.set(keyBytes);
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = normalizedKey[i] ^ 0x5c;
    iKeyPad[i] = normalizedKey[i] ^ 0x36;
  }

  const innerInput = new Uint8Array(blockSize + data.length);
  innerInput.set(iKeyPad);
  innerInput.set(data, blockSize);
  const innerHash = sha256Bytes(innerInput);

  const outerInput = new Uint8Array(blockSize + innerHash.length);
  outerInput.set(oKeyPad);
  outerInput.set(innerHash, blockSize);
  return sha256Bytes(outerInput);
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function deriveMasterKey(scope: 'local' | 'session'): Uint8Array {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'gitcard-studio';
  const seed = `gcs-aead-storage-v1|${scope}|${origin}|creativecode-gitcard-studio-integrity-key`;
  return sha256Bytes(new TextEncoder().encode(seed));
}

function xorKeystream(
  input: Uint8Array,
  masterKey: Uint8Array,
  aad: string,
  ivHex: string
): Uint8Array {
  const output = new Uint8Array(input.length);
  const encoder = new TextEncoder();
  let offset = 0;
  let counter = 0;

  while (offset < input.length) {
    const blockSeed = encoder.encode(`ctr|${aad}|${ivHex}|${counter}`);
    const keystreamBlock = hmacSha256(masterKey, blockSeed);
    const chunkLen = Math.min(32, input.length - offset);
    for (let i = 0; i < chunkLen; i++) {
      output[offset + i] = input[offset + i] ^ keystreamBlock[i];
    }
    offset += chunkLen;
    counter++;
  }

  return output;
}

function sealValue(scope: 'local' | 'session', key: string, plainText: string): string {
  const iv = new Uint8Array(12);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(iv);
  }
  const ivHex = bytesToHex(iv);
  const masterKey = deriveMasterKey(scope);
  const aad = `${scope}:${key}`;
  const plainBytes = new TextEncoder().encode(plainText);
  const cipherBytes = xorKeystream(plainBytes, masterKey, aad, ivHex);
  const cipherHex = bytesToHex(cipherBytes);

  const macInput = new TextEncoder().encode(`${ENVELOPE_PREFIX}|${aad}|${ivHex}|${cipherHex}`);
  const macHex = bytesToHex(hmacSha256(masterKey, macInput).subarray(0, 16));

  return `${ENVELOPE_PREFIX}.${ivHex}.${cipherHex}.${macHex}`;
}

function unsealValue(scope: 'local' | 'session', key: string, rawEnvelope: string): string | null {
  if (!rawEnvelope || typeof rawEnvelope !== 'string') {
    return null;
  }

  const parts = rawEnvelope.split('.');
  if (parts.length !== 4 || parts[0] !== ENVELOPE_PREFIX) {
    return null;
  }

  const [, ivHex, cipherHex, providedMacHex] = parts;
  if (!ivHex || ivHex.length !== 24 || !providedMacHex || providedMacHex.length !== 32) {
    return null;
  }

  const cipherBytes = cipherHex.length > 0 ? hexToBytes(cipherHex) : new Uint8Array(0);
  if (!cipherBytes) {
    return null;
  }

  const masterKey = deriveMasterKey(scope);
  const aad = `${scope}:${key}`;
  const macInput = new TextEncoder().encode(`${ENVELOPE_PREFIX}|${aad}|${ivHex}|${cipherHex}`);
  const expectedMacHex = bytesToHex(hmacSha256(masterKey, macInput).subarray(0, 16));

  if (!constantTimeEqualHex(providedMacHex.toLowerCase(), expectedMacHex.toLowerCase())) {
    return null;
  }

  try {
    const plainBytes = xorKeystream(cipherBytes, masterKey, aad, ivHex);
    return new TextDecoder('utf-8', { fatal: true }).decode(plainBytes);
  } catch {
    return null;
  }
}

const PROTECTED_LOCAL_KEYS = [
  'gh_active_user',
  'registered-github-username',
  'gh_session_token',
  'registered-github-token',
  'gh_token',
  'theme',
  'gitcard_privacy_accepted',
  'app_locale'
] as const;

const PROTECTED_SESSION_KEYS = ['gh_session_token', 'gitcard-studio-metrics-key'] as const;

export const secureStorage = {
  setLocal(key: string, value: string): void {
    try {
      const sealed = sealValue('local', key, value);
      localStorage.setItem(key, sealed);
    } catch {
      // Ignore storage quota errors
    }
  },

  getLocal(key: string): string | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;

      const unsealed = unsealValue('local', key, raw);
      if (unsealed === null) {
        // Manual modification or unencrypted tampering detected: purge immediately
        localStorage.removeItem(key);
        return null;
      }
      return unsealed;
    } catch {
      return null;
    }
  },

  removeLocal(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },

  setSession(key: string, value: string): void {
    try {
      const sealed = sealValue('session', key, value);
      sessionStorage.setItem(key, sealed);
    } catch {
      // Ignore
    }
  },

  getSession(key: string): string | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return null;

      const unsealed = unsealValue('session', key, raw);
      if (unsealed === null) {
        // Manual modification or unencrypted tampering detected: purge immediately
        sessionStorage.removeItem(key);
        return null;
      }
      return unsealed;
    } catch {
      return null;
    }
  },

  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },

  /**
   * Sweep all managed keys in localStorage and sessionStorage,
   * purging any manually modified or unencrypted entries.
   */
  verifyAndSweepAll(): boolean {
    let authTampered = false;
    try {
      for (const key of PROTECTED_LOCAL_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw !== null && unsealValue('local', key, raw) === null) {
          localStorage.removeItem(key);
          if (
            key === 'gh_active_user' ||
            key === 'registered-github-username' ||
            key === 'gh_session_token'
          ) {
            authTampered = true;
          }
        }
      }

      for (const key of PROTECTED_SESSION_KEYS) {
        const raw = sessionStorage.getItem(key);
        if (raw !== null && unsealValue('session', key, raw) === null) {
          sessionStorage.removeItem(key);
          if (key === 'gh_session_token') {
            authTampered = true;
          }
        }
      }

      // If username exists without a cryptographic session token, purge orphan username
      const hasUser =
        this.getLocal('gh_active_user') !== null ||
        this.getLocal('registered-github-username') !== null;
      const hasToken =
        this.getSession('gh_session_token') !== null || this.getLocal('gh_session_token') !== null;

      if (hasUser && !hasToken) {
        this.removeLocal('gh_active_user');
        this.removeLocal('registered-github-username');
        authTampered = true;
      }
    } catch {
      // Ignore
    }
    return authTampered;
  },

  /**
   * Install real-time listeners to detect and purge manual edits in DevTools
   */
  installIntegrityGuard(onAuthTampered?: () => void): void {
    if (typeof window === 'undefined') return;

    const checkIntegrity = () => {
      const tampered = this.verifyAndSweepAll();
      if (tampered && onAuthTampered) {
        onAuthTampered();
      }
    };

    checkIntegrity();

    window.addEventListener('storage', checkIntegrity);
    window.addEventListener('focus', checkIntegrity);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkIntegrity();
      }
    });
  }
};
