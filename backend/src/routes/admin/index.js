import { Router } from 'express';
import { query, transaction } from '../../config/db.js';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { deleteUpload, storeUploads, uploadImages } from '../../middleware/upload.js';
import { asyncHandler, HttpError, paging, pick, required, slugify } from '../../utils/http.js';
import { applyShipmentStatus, getOrderWithItems, releaseStock, reserveStock } from '../../utils/orders.js';
import { assignAwb, cancelShiprocketOrder, createShiprocketOrder, generateLabel, schedulePickup, trackAwb } from '../../utils/shiprocket.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);

// ------------------------------------------------------------------ dashboard
router.get('/stats', asyncHandler(async (_req, res) => {
  const paidCond = "(payment_status = 'paid' OR (payment_method = 'cod' AND status = 'delivered'))";
  const [[totals], [today], [counts], salesByDay, statusBreakdown, topProducts, recentOrders, lowStock] = await Promise.all([
    query(`SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS paid_orders FROM orders WHERE ${paidCond}`),
    query(`SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE DATE(created_at) = CURDATE() AND status <> 'cancelled'`),
    query(`SELECT (SELECT COUNT(*) FROM orders) AS orders,
                  (SELECT COUNT(*) FROM orders WHERE status IN ('pending','confirmed','processing')) AS open_orders,
                  (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
                  (SELECT COUNT(*) FROM products WHERE is_active = 1) AS products,
                  (SELECT COUNT(*) FROM reviews WHERE is_approved = 0) AS pending_reviews,
                  (SELECT COUNT(*) FROM contact_messages WHERE is_read = 0) AS unread_messages`),
    query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
           FROM orders WHERE created_at >= CURDATE() - INTERVAL 29 DAY AND status <> 'cancelled'
           GROUP BY day ORDER BY day`),
    query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status'),
    query(`SELECT oi.product_id, oi.name, oi.image, SUM(oi.qty) AS units, SUM(oi.qty * oi.price) AS revenue
           FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status <> 'cancelled'
           GROUP BY oi.product_id, oi.name, oi.image ORDER BY units DESC LIMIT 5`),
    query(`SELECT o.id, o.order_number, o.ship_name, o.total, o.status, o.payment_status, o.payment_method, o.created_at
           FROM orders o ORDER BY o.created_at DESC, o.id DESC LIMIT 8`),
    query('SELECT id, name, sku, stock FROM products WHERE is_active = 1 AND stock <= 5 ORDER BY stock ASC LIMIT 8'),
  ]);
  res.json({ totals, today, counts, salesByDay, statusBreakdown, topProducts, recentOrders, lowStock });
}));

// ------------------------------------------------------------------ uploads
router.post('/uploads', uploadImages, asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new HttpError(400, 'No images received');
  res.status(201).json({ urls: await storeUploads(req.files) });
}));

// ------------------------------------------------------------------ categories
router.get('/categories', asyncHandler(async (_req, res) => {
  res.json({
    categories: await query(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.sort_order, c.name`,
    ),
  });
}));

const CATEGORY_FIELDS = ['name', 'slug', 'description', 'image', 'sort_order', 'is_active'];

function categoryData(body) {
  const data = pick(body, CATEGORY_FIELDS);
  if (data.name && !data.slug) data.slug = slugify(data.name);
  if (data.slug) data.slug = slugify(data.slug);
  if (data.is_active !== undefined) data.is_active = bool(data.is_active);
  if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order) || 0;
  return data;
}

router.post('/categories', asyncHandler(async (req, res) => {
  required(req.body, ['name']);
  const r = await query('INSERT INTO categories SET ?', [categoryData(req.body)]);
  const [category] = await query('SELECT * FROM categories WHERE id = ?', [r.insertId]);
  res.status(201).json({ category });
}));

router.put('/categories/:id', asyncHandler(async (req, res) => {
  const data = categoryData(req.body);
  if (Object.keys(data).length) await query('UPDATE categories SET ? WHERE id = ?', [data, req.params.id]);
  const [category] = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ category });
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ products
router.get('/products', asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 20, 100);
  const where = [];
  const params = [];
  if (req.query.q) {
    where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.color LIKE ?)');
    params.push(`%${req.query.q}%`, `%${req.query.q}%`, `%${req.query.q}%`);
  }
  if (req.query.category) { where.push('p.category_id = ?'); params.push(req.query.category); }
  if (req.query.status === 'active') where.push('p.is_active = 1');
  if (req.query.status === 'inactive') where.push('p.is_active = 0');
  if (req.query.status === 'low') where.push('p.stock <= 5');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const products = await query(
    `SELECT p.id, p.name, p.slug, p.sku, p.color, p.price, p.mrp, p.stock, p.is_active, p.is_featured, p.is_new, p.created_at,
       c.name AS category_name,
       (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
     FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}
     ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  res.json({ products, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const [product] = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) throw new HttpError(404, 'Product not found');
  product.images = await query('SELECT id, url FROM product_images WHERE product_id = ? ORDER BY sort_order', [product.id]);
  res.json({ product });
}));

const PRODUCT_FIELDS = ['category_id', 'name', 'slug', 'sku', 'short_description', 'description', 'fabric', 'color', 'color_hex', 'occasion',
  'work', 'saree_length', 'blouse', 'wash_care', 'price', 'mrp', 'stock', 'is_featured', 'is_new', 'is_active'];

function productData(body) {
  const data = pick(body, PRODUCT_FIELDS);
  if (data.name && !data.slug) data.slug = slugify(data.name);
  if (data.slug) data.slug = slugify(data.slug);
  for (const k of ['is_featured', 'is_new', 'is_active']) if (data[k] !== undefined) data[k] = bool(data[k]);
  for (const k of ['price', 'mrp']) if (data[k] !== undefined) data[k] = data[k] === '' || data[k] === null ? null : Number(data[k]);
  if (data.stock !== undefined) data.stock = Math.max(0, parseInt(data.stock, 10) || 0);
  if (data.category_id !== undefined) data.category_id = data.category_id ? Number(data.category_id) : null;
  if (data.price !== undefined && !(data.price > 0)) throw new HttpError(400, 'Price must be greater than 0');
  return data;
}

async function saveImages(q, productId, images) {
  if (!Array.isArray(images)) return;
  await q('DELETE FROM product_images WHERE product_id = ?', [productId]);
  for (const [i, url] of images.entries()) {
    await q('INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)', [productId, typeof url === 'string' ? url : url.url, i + 1]);
  }
}

router.post('/products', asyncHandler(async (req, res) => {
  required(req.body, ['name', 'sku', 'price']);
  const id = await transaction(async (q) => {
    const r = await q('INSERT INTO products SET ?', [productData(req.body)]);
    await saveImages(q, r.insertId, req.body.images || []);
    return r.insertId;
  });
  res.status(201).json({ id });
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  await transaction(async (q) => {
    const data = productData(req.body);
    if (Object.keys(data).length) {
      const r = await q('UPDATE products SET ? WHERE id = ?', [data, req.params.id]);
      if (!r.affectedRows) throw new HttpError(404, 'Product not found');
    }
    await saveImages(q, req.params.id, req.body.images);
  });
  res.json({ id: Number(req.params.id) });
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  // Products referenced by orders keep their order_items (FK sets NULL), so hard delete is safe.
  const images = await query('SELECT url FROM product_images WHERE product_id = ?', [req.params.id]);
  await query('DELETE FROM products WHERE id = ?', [req.params.id]);
  for (const { url } of images) await deleteUpload(url);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ orders
router.get('/orders', asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 20, 100);
  const where = [];
  const params = [];
  if (req.query.status) { where.push('o.status = ?'); params.push(req.query.status); }
  if (req.query.payment) { where.push('o.payment_status = ?'); params.push(req.query.payment); }
  if (req.query.q) {
    where.push('(o.order_number LIKE ? OR o.ship_name LIKE ? OR o.ship_phone LIKE ? OR o.ship_email LIKE ?)');
    params.push(...Array(4).fill(`%${req.query.q}%`));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orders = await query(
    `SELECT o.id, o.order_number, o.ship_name, o.ship_phone, o.ship_city, o.total, o.status, o.payment_method, o.payment_status, o.created_at,
       (SELECT SUM(qty) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o ${whereSql} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await getOrderWithItems(req.params.id);
  const [customer] = order.user_id ? await query('SELECT id, name, email, phone FROM users WHERE id = ?', [order.user_id]) : [null];
  res.json({ order: { ...order, customer } });
}));

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

router.put('/orders/:id', asyncHandler(async (req, res) => {
  const { status, payment_status: paymentStatus, tracking_number: tracking } = req.body;
  if (status && !STATUSES.includes(status)) throw new HttpError(400, 'Invalid order status');
  if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) throw new HttpError(400, 'Invalid payment status');
  await transaction(async (q) => {
    const [order] = await q('SELECT * FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!order) throw new HttpError(404, 'Order not found');
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.payment_status = paymentStatus;
    if (tracking !== undefined) updates.tracking_number = tracking || null;
    if (Object.keys(updates).length) await q('UPDATE orders SET ? WHERE id = ?', [updates, order.id]);
    if (status === 'cancelled') await releaseStock(order.id, q);
    else if (status && status !== 'pending') await reserveStock(order.id, q);
  });
  const order = await getOrderWithItems(req.params.id);
  if (status === 'cancelled' && order.shiprocket_order_id && order.shipment_status !== 'CANCELED') {
    // Stop the courier from picking up a cancelled order; the order itself stays cancelled even if this fails.
    try {
      await cancelShiprocketOrder(order.shiprocket_order_id);
      await query("UPDATE orders SET shipment_status = 'CANCELED' WHERE id = ?", [order.id]);
      order.shipment_status = 'CANCELED';
    } catch (err) {
      console.error(`Could not cancel Shiprocket order for ${order.order_number}: ${err.message}`);
    }
  }
  res.json({ order });
}));

// ------------------------------------------------------------------ shiprocket
/**
 * Ships an order via Shiprocket: create order → assign courier/AWB → schedule pickup → label.
 * Each step's result is saved, so calling this again after a failure resumes where it stopped.
 */
router.post('/orders/:id/shiprocket', asyncHandler(async (req, res) => {
  let order = await getOrderWithItems(req.params.id);
  if (!['confirmed', 'processing'].includes(order.status)) throw new HttpError(400, 'Only confirmed or processing orders can be shipped');
  if (order.payment_method === 'razorpay' && order.payment_status !== 'paid') throw new HttpError(400, 'This order has not been paid yet');
  const save = (updates) => query('UPDATE orders SET ? WHERE id = ?', [updates, order.id]);

  if (!order.shiprocket_shipment_id) {
    const sr = await createShiprocketOrder(order);
    await save({ shiprocket_order_id: String(sr.order_id), shiprocket_shipment_id: String(sr.shipment_id), status: 'processing' });
    order = await getOrderWithItems(order.id);
  }
  if (!order.tracking_number) {
    const { awb, courierName } = await assignAwb(order.shiprocket_shipment_id, req.body.courier_id);
    await save({ tracking_number: awb, courier_name: courierName, shipment_status: 'AWB ASSIGNED' });
  }
  if (!order.label_url) {
    await schedulePickup(order.shiprocket_shipment_id);
    await save({ shipment_status: 'PICKUP SCHEDULED', label_url: await generateLabel(order.shiprocket_shipment_id) });
  }
  res.json({ order: await getOrderWithItems(order.id) });
}));

router.post('/orders/:id/shiprocket/track', asyncHandler(async (req, res) => {
  const order = await getOrderWithItems(req.params.id);
  if (!order.tracking_number) throw new HttpError(400, 'This order has no AWB yet');
  await applyShipmentStatus(order.id, await trackAwb(order.tracking_number));
  res.json({ order: await getOrderWithItems(order.id) });
}));

/** Cancels the shipment in Shiprocket (not the order itself) so it can be re-shipped or cancelled separately. */
router.post('/orders/:id/shiprocket/cancel', asyncHandler(async (req, res) => {
  const order = await getOrderWithItems(req.params.id);
  if (!order.shiprocket_order_id) throw new HttpError(400, 'This order has not been sent to Shiprocket');
  if (['shipped', 'delivered'].includes(order.status)) throw new HttpError(400, 'The courier already has this parcel; cancel it from the Shiprocket dashboard');
  await cancelShiprocketOrder(order.shiprocket_order_id);
  await query(
    `UPDATE orders SET shiprocket_order_id = NULL, shiprocket_shipment_id = NULL, tracking_number = NULL, courier_name = NULL,
       label_url = NULL, shipment_status = NULL WHERE id = ?`,
    [order.id],
  );
  res.json({ order: await getOrderWithItems(order.id) });
}));

// ------------------------------------------------------------------ customers
router.get('/customers', asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 20, 100);
  const params = [];
  let where = "WHERE u.role = 'customer'";
  if (req.query.q) {
    where += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
    params.push(...Array(3).fill(`%${req.query.q}%`));
  }
  const customers = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
       COUNT(o.id) AS orders, COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total END), 0) AS spent, MAX(o.created_at) AS last_order
     FROM users u LEFT JOIN orders o ON o.user_id = u.id ${where}
     GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
  res.json({ customers, total, page, pages: Math.ceil(total / limit) });
}));

router.put('/customers/:id', asyncHandler(async (req, res) => {
  await query("UPDATE users SET is_active = ? WHERE id = ? AND role = 'customer'", [bool(req.body.is_active), req.params.id]);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ coupons
const COUPON_FIELDS = ['code', 'description', 'type', 'value', 'min_order', 'max_discount', 'usage_limit', 'expires_at', 'is_active'];

function couponData(body) {
  const data = pick(body, COUPON_FIELDS);
  if (data.code) data.code = String(data.code).trim().toUpperCase();
  if (data.type && !['percent', 'flat'].includes(data.type)) throw new HttpError(400, 'Invalid coupon type');
  for (const k of ['max_discount', 'usage_limit', 'expires_at']) if (data[k] === '') data[k] = null;
  if (data.is_active !== undefined) data.is_active = bool(data.is_active);
  return data;
}

router.get('/coupons', asyncHandler(async (_req, res) => {
  res.json({ coupons: await query('SELECT * FROM coupons ORDER BY created_at DESC') });
}));

router.post('/coupons', asyncHandler(async (req, res) => {
  required(req.body, ['code', 'type', 'value']);
  const r = await query('INSERT INTO coupons SET ?', [couponData(req.body)]);
  res.status(201).json({ id: r.insertId });
}));

router.put('/coupons/:id', asyncHandler(async (req, res) => {
  await query('UPDATE coupons SET ? WHERE id = ?', [couponData(req.body), req.params.id]);
  res.json({ ok: true });
}));

router.delete('/coupons/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ reviews
router.get('/reviews', asyncHandler(async (req, res) => {
  const where = req.query.status === 'pending' ? 'WHERE r.is_approved = 0' : req.query.status === 'approved' ? 'WHERE r.is_approved = 1' : '';
  res.json({
    reviews: await query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email, p.name AS product_name, p.slug AS product_slug
       FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id ${where} ORDER BY r.created_at DESC LIMIT 200`,
    ),
  });
}));

router.put('/reviews/:id', asyncHandler(async (req, res) => {
  await query('UPDATE reviews SET is_approved = ? WHERE id = ?', [bool(req.body.is_approved), req.params.id]);
  res.json({ ok: true });
}));

router.delete('/reviews/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ messages & subscribers
router.get('/messages', asyncHandler(async (_req, res) => {
  res.json({ messages: await query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200') });
}));

router.put('/messages/:id', asyncHandler(async (req, res) => {
  await query('UPDATE contact_messages SET is_read = ? WHERE id = ?', [bool(req.body.is_read), req.params.id]);
  res.json({ ok: true });
}));

router.delete('/messages/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.get('/subscribers', asyncHandler(async (_req, res) => {
  res.json({ subscribers: await query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC') });
}));

export default router;
