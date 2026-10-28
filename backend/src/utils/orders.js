import { query } from '../config/db.js';
import { HttpError } from './http.js';

export const storeRules = () => ({
  shippingFee: Number(process.env.SHIPPING_FEE ?? 99),
  freeShippingAbove: Number(process.env.FREE_SHIPPING_ABOVE ?? 1999),
  codEnabled: String(process.env.COD_ENABLED ?? 'true') === 'true',
});

const round2 = (n) => Math.round(n * 100) / 100;

/** Validates a coupon against a subtotal; returns { coupon, discount } or throws. */
export async function evaluateCoupon(code, subtotal, q = query) {
  const [coupon] = await q('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [String(code).trim().toUpperCase()]);
  if (!coupon) throw new HttpError(400, 'This coupon code is not valid');
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new HttpError(400, 'This coupon has expired');
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) throw new HttpError(400, 'This coupon has reached its usage limit');
  if (subtotal < Number(coupon.min_order)) {
    throw new HttpError(400, `Add items worth ₹${Number(coupon.min_order).toLocaleString('en-IN')} or more to use this coupon`);
  }
  let discount = coupon.type === 'percent' ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);
  if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount));
  return { coupon, discount: round2(Math.min(discount, subtotal)) };
}

/**
 * Prices a cart using database prices. items: [{ productId, qty }].
 * Returns { lines, subtotal, discount, shipping, total, couponCode }.
 */
export async function priceCart(items, couponCode, q = query) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Your cart is empty');
  const qtyById = new Map();
  for (const it of items) {
    const id = Number(it.productId);
    const qty = Math.floor(Number(it.qty));
    if (!id || !qty || qty < 1 || qty > 10) throw new HttpError(400, 'Invalid cart item');
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  }
  const ids = [...qtyById.keys()];
  const products = await q(
    `SELECT p.id, p.name, p.sku, p.price, p.stock, p.is_active,
       (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
     FROM products p WHERE p.id IN (?)`,
    [ids],
  );
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = [];
  for (const [id, qty] of qtyById) {
    const p = byId.get(id);
    if (!p || !p.is_active) throw new HttpError(400, 'One of the items in your cart is no longer available');
    if (p.stock < qty) throw new HttpError(400, `Only ${p.stock} left in stock for "${p.name}"`);
    lines.push({ productId: p.id, name: p.name, sku: p.sku, image: p.image, price: Number(p.price), qty });
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  let discount = 0;
  let appliedCode = null;
  if (couponCode) {
    const r = await evaluateCoupon(couponCode, subtotal, q);
    discount = r.discount;
    appliedCode = r.coupon.code;
  }
  const rules = storeRules();
  const shipping = subtotal - discount >= rules.freeShippingAbove ? 0 : rules.shippingFee;
  return { lines, subtotal, discount, shipping, total: round2(subtotal - discount + shipping), couponCode: appliedCode };
}

/**
 * Reserves stock for an order and bumps coupon usage. Idempotent via orders.stock_reserved.
 * Must run inside a transaction (q is the transaction query function).
 */
export async function reserveStock(orderId, q) {
  const [order] = await q('SELECT id, stock_reserved, coupon_code FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  if (!order || order.stock_reserved) return;
  const items = await q('SELECT product_id, qty FROM order_items WHERE order_id = ?', [orderId]);
  for (const it of items) {
    if (it.product_id) await q('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [it.qty, it.product_id]);
  }
  if (order.coupon_code) await q('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [order.coupon_code]);
  await q('UPDATE orders SET stock_reserved = 1 WHERE id = ?', [orderId]);
}

/** Returns stock to inventory when a reserved order is cancelled. */
export async function releaseStock(orderId, q) {
  const [order] = await q('SELECT id, stock_reserved FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  if (!order || !order.stock_reserved) return;
  const items = await q('SELECT product_id, qty FROM order_items WHERE order_id = ?', [orderId]);
  for (const it of items) {
    if (it.product_id) await q('UPDATE products SET stock = stock + ? WHERE id = ?', [it.qty, it.product_id]);
  }
  await q('UPDATE orders SET stock_reserved = 0 WHERE id = ?', [orderId]);
}

export async function getOrderWithItems(id, userId) {
  const params = [id];
  let sql = 'SELECT * FROM orders WHERE id = ?';
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }
  const [order] = await query(sql, params);
  if (!order) throw new HttpError(404, 'Order not found');
  order.items = await query('SELECT id, product_id, name, sku, image, price, qty FROM order_items WHERE order_id = ?', [id]);
  return order;
}

export function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MS${ymd}${Math.floor(100000 + Math.random() * 900000)}`;
}
