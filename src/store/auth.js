// Local-first, multi-user auth. Accounts + hashed passwords live in
// localStorage so anyone can create their own space on their device — no
// backend required. This is device-local demo auth, NOT server security.
//
// A self-contained SHA-256 is used (rather than crypto.subtle) so hashing is
// identical whether the app is opened on https/localhost (secure context) or
// over http on a phone across the LAN (non-secure context, where subtle crypto
// is unavailable).

const ACCOUNTS_KEY = 'des.accounts.v1';
const SESSION_KEY = 'des.session.v1';

/* ------------------------------- SHA-256 -------------------------------- */
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rrot(x, n) {
  return (x >>> n) | (x << (32 - n));
}

function sha256(ascii) {
  const words = [];
  const asciiBitLength = ascii.length * 8;
  const bytes = [];
  for (let i = 0; i < ascii.length; i++) {
    let code = ascii.charCodeAt(i);
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 0xff);
  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array(64);

  for (let j = 0; j < words.length; j += 16) {
    for (let i = 0; i < 16; i++) w[i] = words[j + i];
    for (let i = 16; i < 64; i++) {
      const s0 = rrot(w[i - 15], 7) ^ rrot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rrot(w[i - 2], 17) ^ rrot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  void asciiBitLength;
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
}

function hashPassword(password, salt, iterations = 800) {
  let out = sha256(`${salt}::${password}`);
  for (let i = 0; i < iterations; i++) out = sha256(out + salt);
  return out;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function randomSalt() {
  return randomId() + randomId();
}

/* ------------------------------ storage --------------------------------- */
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('auth: storage write failed', err);
  }
}

export function listAccounts() {
  return readJson(ACCOUNTS_KEY, []);
}
function saveAccounts(accounts) {
  writeJson(ACCOUNTS_KEY, accounts);
}
export function accountCount() {
  return listAccounts().filter((a) => !a.isGuest).length;
}

export function getUserById(id) {
  const a = listAccounts().find((x) => x.id === id);
  if (!a) return null;
  const { hash, salt, ...safe } = a;
  void hash; void salt;
  return safe;
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function register({ name, email, password, avatarColor }) {
  const clean = normalizeEmail(email);
  const trimmedName = (name || '').trim();
  if (!trimmedName) return { ok: false, error: 'Please enter your name.' };
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, error: 'Enter a valid email.' };
  if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  const accounts = listAccounts();
  if (accounts.some((a) => a.email === clean)) return { ok: false, error: 'An account with this email already exists.' };
  const salt = randomSalt();
  const account = {
    id: randomId(),
    name: trimmedName,
    email: clean,
    salt,
    hash: hashPassword(password, salt),
    avatarColor: avatarColor || '#34d399',
    createdAt: new Date().toISOString(),
    isGuest: false,
  };
  accounts.push(account);
  saveAccounts(accounts);
  setSession(account.id);
  return { ok: true, user: getUserById(account.id) };
}

export function login({ email, password }) {
  const clean = normalizeEmail(email);
  const account = listAccounts().find((a) => a.email === clean);
  if (!account) return { ok: false, error: 'No account found with that email.' };
  if (hashPassword(password, account.salt) !== account.hash) return { ok: false, error: 'Incorrect password.' };
  setSession(account.id);
  return { ok: true, user: getUserById(account.id) };
}

export function loginAsGuest() {
  const accounts = listAccounts();
  const account = {
    id: randomId(),
    name: 'Guest',
    email: `guest_${randomId()}@local`,
    salt: '',
    hash: '',
    avatarColor: '#60a5fa',
    createdAt: new Date().toISOString(),
    isGuest: true,
  };
  accounts.push(account);
  saveAccounts(accounts);
  setSession(account.id);
  return { ok: true, user: getUserById(account.id) };
}

export function updateAccount(id, patch) {
  const accounts = listAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return;
  const allowed = ['name', 'avatarColor', 'avatarUrl'];
  for (const key of allowed) if (patch[key] !== undefined) accounts[idx][key] = patch[key];
  saveAccounts(accounts);
}

export function changePassword(id, newPassword) {
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  const accounts = listAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return { ok: false, error: 'Account not found.' };
  const salt = randomSalt();
  accounts[idx].salt = salt;
  accounts[idx].hash = hashPassword(newPassword, salt);
  accounts[idx].isGuest = false;
  saveAccounts(accounts);
  return { ok: true };
}

export function deleteAccount(id) {
  saveAccounts(listAccounts().filter((a) => a.id !== id));
  const session = getSession();
  if (session?.userId === id) clearSession();
  // Wipe that user's namespaced data.
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`des.u.${id}.`))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/* ------------------------------ session --------------------------------- */
export function getSession() {
  return readJson(SESSION_KEY, null);
}
export function setSession(userId) {
  writeJson(SESSION_KEY, { userId, at: new Date().toISOString() });
}
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

export function currentUser() {
  const session = getSession();
  if (!session) return null;
  return getUserById(session.userId);
}
