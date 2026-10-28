import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query } from '../config/db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError, isEmail, required } from '../utils/http.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });

router.post('/register', limiter, asyncHandler(async (req, res) => {
  required(req.body, ['name', 'email', 'password']);
  const { name, phone } = req.body;
  const email = String(req.body.email).trim().toLowerCase();
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address');
  if (String(req.body.password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  const [exists] = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) throw new HttpError(409, 'An account with this email already exists');
  const hash = await bcrypt.hash(req.body.password, 10);
  const r = await query('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)', [String(name).trim(), email, phone || null, hash]);
  const user = { id: r.insertId, name, email, phone: phone || null, role: 'customer' };
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', limiter, asyncHandler(async (req, res) => {
  required(req.body, ['email', 'password']);
  const email = String(req.body.email).trim().toLowerCase();
  const [user] = await query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  if (!user || !(await bcrypt.compare(String(req.body.password), user.password_hash))) {
    throw new HttpError(401, 'Incorrect email or password');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/me', requireAuth, asyncHandler(async (req, res) => {
  required(req.body, ['name']);
  await query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [String(req.body.name).trim(), req.body.phone || null, req.user.id]);
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: publicUser(user) });
}));

router.put('/password', requireAuth, asyncHandler(async (req, res) => {
  required(req.body, ['currentPassword', 'newPassword']);
  if (String(req.body.newPassword).length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
  const [user] = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(String(req.body.currentPassword), user.password_hash))) throw new HttpError(400, 'Current password is incorrect');
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(req.body.newPassword, 10), req.user.id]);
  res.json({ message: 'Password updated' });
}));

export default router;
