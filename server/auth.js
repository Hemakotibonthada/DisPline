import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'des-dev-secret-change-me';

export function signToken(userId) {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function authMiddleware(req, res, next) {
  const header = req.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    if (!payload?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.userId = payload.uid;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
