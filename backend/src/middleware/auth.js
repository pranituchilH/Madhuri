import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function loadUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await query('SELECT id, name, email, phone, role FROM users WHERE id = ? AND is_active = 1', [payload.id]);
    return user || null;
  } catch {
    return null;
  }
}

export async function optionalAuth(req, _res, next) {
  req.user = await loadUser(req);
  next();
}

export async function requireAuth(req, _res, next) {
  req.user = await loadUser(req);
  if (!req.user) return next(new HttpError(401, 'Please log in to continue'));
  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Admin access required'));
  next();
}
