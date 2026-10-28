import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, isPhone, isPincode, required } from '../utils/http.js';
import { PRODUCT_CARD_SQL } from './catalog.js';

const router = Router();
router.use(requireAuth);

// ---- addresses
const ADDRESS_FIELDS = ['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'];

export function validateAddress(a) {
  required(a, ['name', 'phone', 'line1', 'city', 'state', 'pincode']);
  if (!isPhone(a.phone)) throw new HttpError(400, 'Please enter a valid 10-digit mobile number');
  if (!isPincode(a.pincode)) throw new HttpError(400, 'Please enter a valid 6-digit pincode');
}

router.get('/addresses', asyncHandler(async (req, res) => {
  res.json({ addresses: await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [req.user.id]) });
}));

router.post('/addresses', asyncHandler(async (req, res) => {
  validateAddress(req.body);
  const [{ n }] = await query('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?', [req.user.id]);
  const isDefault = n === 0 || req.body.is_default ? 1 : 0;
  if (isDefault) await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  const r = await query(
    'INSERT INTO addresses (user_id, name, phone, line1, line2, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, ...ADDRESS_FIELDS.map((f) => req.body[f] || null), isDefault],
  );
  const [address] = await query('SELECT * FROM addresses WHERE id = ?', [r.insertId]);
  res.status(201).json({ address });
}));

router.put('/addresses/:id', asyncHandler(async (req, res) => {
  validateAddress(req.body);
  if (req.body.is_default) await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  const r = await query(
    `UPDATE addresses SET name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, state = ?, pincode = ?, is_default = IF(?, 1, is_default)
     WHERE id = ? AND user_id = ?`,
    [...ADDRESS_FIELDS.map((f) => req.body[f] || null), req.body.is_default ? 1 : 0, req.params.id, req.user.id],
  );
  if (!r.affectedRows) throw new HttpError(404, 'Address not found');
  const [address] = await query('SELECT * FROM addresses WHERE id = ?', [req.params.id]);
  res.json({ address });
}));

router.delete('/addresses/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

// ---- wishlist
router.get('/wishlist', asyncHandler(async (req, res) => {
  const products = await query(
    `${PRODUCT_CARD_SQL} JOIN wishlist w ON w.product_id = p.id WHERE w.user_id = ? AND p.is_active = 1 ORDER BY w.created_at DESC`,
    [req.user.id],
  );
  res.json({ products });
}));

router.post('/wishlist/:productId', asyncHandler(async (req, res) => {
  await query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, req.params.productId]);
  res.status(201).json({ ok: true });
}));

router.delete('/wishlist/:productId', asyncHandler(async (req, res) => {
  await query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  res.json({ ok: true });
}));

export default router;
