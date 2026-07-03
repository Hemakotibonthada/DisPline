import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Persist to DATA_DIR when provided (e.g. a mounted disk on a cloud host),
// otherwise alongside the server. This keeps accounts/friends across restarts.
const dataDir = process.env.DATA_DIR || __dirname;
try { fs.mkdirSync(dataDir, { recursive: true }); } catch { /* ignore */ }
const dataPath = path.join(dataDir, 'data.json');

const emptyDb = () => ({ users: [], invites: [], states: {} });

function normalizeDb(value) {
  const next = value && typeof value === 'object' ? value : emptyDb();
  return {
    users: Array.isArray(next.users) ? next.users : [],
    invites: Array.isArray(next.invites) ? next.invites : [],
    states: next.states && typeof next.states === 'object' && !Array.isArray(next.states) ? next.states : {},
  };
}

function loadDb() {
  try {
    if (!fs.existsSync(dataPath)) {
      return emptyDb();
    }

    return normalizeDb(JSON.parse(fs.readFileSync(dataPath, 'utf8')));
  } catch (error) {
    console.warn('Failed to load server/data.json; starting with an empty database.', error.message);
    return emptyDb();
  }
}

export const db = loadDb();

export function save() {
  try {
    fs.writeFileSync(dataPath, `${JSON.stringify(normalizeDb(db), null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error('Failed to save server/data.json.', error.message);
  }
}

export function getUser(id) {
  return db.users.find((user) => user.id === id) || null;
}

export function findUserByEmail(email) {
  const target = String(email || '').trim().toLowerCase();
  return db.users.find((user) => user.email?.toLowerCase() === target) || null;
}

export function findUserByUsername(username) {
  const target = String(username || '').trim().toLowerCase();
  return db.users.find((user) => user.username?.toLowerCase() === target) || null;
}

export function genId() {
  return crypto.randomBytes(16).toString('hex');
}
