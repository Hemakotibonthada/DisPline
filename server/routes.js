import express from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, signToken } from './auth.js';
import { db, save, getUser, findUserByEmail, findUserByUsername, genId } from './db.js';

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]+$/;

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl || null,
  };
}

function selfUser(user) {
  return { ...publicUser(user), email: user.email, createdAt: user.createdAt };
}

function cleanAvatarUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(value)) return '';
  if (value.length > 500000) return ''; // ~375KB image cap
  return value;
}

function normalizeIdentifier(identifier) {
  return String(identifier || '').trim().toLowerCase();
}

function findUserByIdentifier(identifier) {
  const value = normalizeIdentifier(identifier);
  return value.includes('@') ? findUserByEmail(value) : findUserByUsername(value);
}

function acceptedInviteBetween(userId, otherUserId) {
  return db.invites.find((invite) => invite.status === 'accepted'
    && ((invite.fromUserId === userId && invite.toUserId === otherUserId)
      || (invite.fromUserId === otherUserId && invite.toUserId === userId))) || null;
}

function pendingInviteBetween(userId, otherUserId) {
  return db.invites.find((invite) => invite.status === 'pending'
    && ((invite.fromUserId === userId && invite.toUserId === otherUserId)
      || (invite.fromUserId === otherUserId && invite.toUserId === userId))) || null;
}

function getFriendIds(userId) {
  return db.invites
    .filter((invite) => invite.status === 'accepted' && (invite.fromUserId === userId || invite.toUserId === userId))
    .map((invite) => (invite.fromUserId === userId ? invite.toUserId : invite.fromUserId));
}

function requireCurrentUser(req, res) {
  const user = getUser(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return null;
  }
  return user;
}

router.post('/auth/register', asyncHandler(async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const username = String(req.body?.username || '').trim().toLowerCase();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const avatarColor = String(req.body?.avatarColor || '#34d399').trim() || '#34d399';
  const avatarUrl = cleanAvatarUrl(req.body?.avatarUrl);

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (username.length < 3 || username.length > 20 || !usernamePattern.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 letters, numbers, or underscores' });
  }
  if (!emailPattern.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (findUserByEmail(email) || findUserByUsername(username)) {
    return res.status(409).json({ error: 'Email or username already exists' });
  }

  const user = {
    id: genId(),
    name,
    username,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    avatarColor,
    avatarUrl,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save();

  return res.status(201).json({ token: signToken(user.id), user: selfUser(user) });
}));

router.post('/auth/login', asyncHandler(async (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  const password = String(req.body?.password || '');
  const user = findUserByIdentifier(identifier);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return res.json({ token: signToken(user.id), user: selfUser(user) });
}));

router.get('/auth/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = requireCurrentUser(req, res);
  if (!user) return;
  res.json({ user: selfUser(user) });
}));

router.patch('/auth/profile', authMiddleware, asyncHandler(async (req, res) => {
  const user = requireCurrentUser(req, res);
  if (!user) return;

  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'name')) {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name cannot be empty' });
    user.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'avatarColor')) {
    const avatarColor = String(req.body.avatarColor || '').trim();
    if (!avatarColor) return res.status(400).json({ error: 'Avatar color cannot be empty' });
    user.avatarColor = avatarColor;
  }
  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'avatarUrl')) {
    user.avatarUrl = cleanAvatarUrl(req.body.avatarUrl);
  }

  save();
  res.json({ ok: true, user: selfUser(user) });
}));

router.get('/state', authMiddleware, asyncHandler(async (req, res) => {
  const record = db.states[req.userId] || null;
  res.json({ state: record?.state ?? null, updatedAt: record?.updatedAt ?? null });
}));

router.put('/state', authMiddleware, asyncHandler(async (req, res) => {
  const user = requireCurrentUser(req, res);
  if (!user) return;

  const updatedAt = new Date().toISOString();
  db.states[req.userId] = {
    state: req.body?.state ?? null,
    summary: req.body?.summary ?? null,
    trends: Array.isArray(req.body?.trends) ? req.body.trends : (req.body?.trends ?? []),
    categories: req.body?.categories && typeof req.body.categories === 'object' && !Array.isArray(req.body.categories) ? req.body.categories : {},
    updatedAt,
  };
  save();
  res.json({ ok: true, updatedAt });
}));

router.get('/users/search', authMiddleware, asyncHandler(async (req, res) => {
  const q = String(req.query?.q || '').trim().toLowerCase();
  if (!q) return res.json([]);

  const matches = db.users
    .filter((user) => user.id !== req.userId)
    .filter((user) => !acceptedInviteBetween(req.userId, user.id) && !pendingInviteBetween(req.userId, user.id))
    .filter((user) => [user.username, user.email, user.name].some((value) => String(value || '').toLowerCase().includes(q)))
    .slice(0, 10)
    .map(publicUser);

  res.json(matches);
}));

router.post('/invites', authMiddleware, asyncHandler(async (req, res) => {
  const target = findUserByIdentifier(req.body?.identifier);
  if (!target) return res.status(404).json({ error: 'No user found' });
  if (target.id === req.userId) return res.status(400).json({ error: "That's you" });
  if (acceptedInviteBetween(req.userId, target.id)) return res.status(400).json({ error: 'Already friends' });
  if (pendingInviteBetween(req.userId, target.id)) return res.status(400).json({ error: 'Invite already pending' });

  db.invites.push({
    id: genId(),
    fromUserId: req.userId,
    toUserId: target.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  save();
  res.status(201).json({ ok: true });
}));

router.get('/invites', authMiddleware, asyncHandler(async (req, res) => {
  const pending = db.invites.filter((invite) => invite.status === 'pending');
  res.json({
    incoming: pending
      .filter((invite) => invite.toUserId === req.userId)
      .map((invite) => ({ id: invite.id, from: publicUser(getUser(invite.fromUserId)), createdAt: invite.createdAt }))
      .filter((invite) => invite.from),
    outgoing: pending
      .filter((invite) => invite.fromUserId === req.userId)
      .map((invite) => ({ id: invite.id, to: publicUser(getUser(invite.toUserId)), createdAt: invite.createdAt }))
      .filter((invite) => invite.to),
  });
}));

router.post('/invites/:id/accept', authMiddleware, asyncHandler(async (req, res) => {
  const invite = db.invites.find((item) => item.id === req.params.id && item.status === 'pending');
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  if (invite.toUserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  invite.status = 'accepted';
  save();
  res.json({ ok: true });
}));

router.post('/invites/:id/decline', authMiddleware, asyncHandler(async (req, res) => {
  const invite = db.invites.find((item) => item.id === req.params.id && item.status === 'pending');
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  if (invite.toUserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  invite.status = 'declined';
  save();
  res.json({ ok: true });
}));

router.delete('/invites/:id', authMiddleware, asyncHandler(async (req, res) => {
  const index = db.invites.findIndex((item) => item.id === req.params.id && item.status === 'pending');
  if (index === -1) return res.status(404).json({ error: 'Invite not found' });
  if (db.invites[index].fromUserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  db.invites.splice(index, 1);
  save();
  res.json({ ok: true });
}));

router.get('/friends', authMiddleware, asyncHandler(async (req, res) => {
  const friends = getFriendIds(req.userId).map(getUser).filter(Boolean).map(publicUser);
  res.json(friends);
}));

router.delete('/friends/:id', authMiddleware, asyncHandler(async (req, res) => {
  const index = db.invites.findIndex((invite) => invite.status === 'accepted'
    && ((invite.fromUserId === req.userId && invite.toUserId === req.params.id)
      || (invite.fromUserId === req.params.id && invite.toUserId === req.userId)));
  if (index === -1) return res.status(404).json({ error: 'Friendship not found' });

  db.invites.splice(index, 1);
  save();
  res.json({ ok: true });
}));

router.get('/friends/:id/progress', authMiddleware, asyncHandler(async (req, res) => {
  const friend = getUser(req.params.id);
  if (!friend || !acceptedInviteBetween(req.userId, req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const record = db.states[req.params.id] || {};
  res.json({
    user: publicUser(friend),
    summary: record.summary ?? null,
    trends: record.trends ?? [],
    categories: record.categories ?? {},
    updatedAt: record.updatedAt ?? null,
  });
}));

router.get('/leaderboard', authMiddleware, asyncHandler(async (req, res) => {
  const userIds = [req.userId, ...getFriendIds(req.userId)];
  const seen = new Set();
  const leaderboard = userIds
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((id) => {
      const user = getUser(id);
      if (!user) return null;
      const summary = db.states[id]?.summary || {};
      return {
        ...publicUser(user),
        xp: Number(summary.xp) || 0,
        level: Number(summary.level) || 0,
        streak: Number(summary.streak) || 0,
        actions: Number(summary.actions) || 0,
        isMe: id === req.userId,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.xp - a.xp);

  res.json(leaderboard);
}));

router.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Internal server error' });
});

export default router;
