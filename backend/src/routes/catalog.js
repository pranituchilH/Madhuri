import { Router } from 'express';
import { query } from '../config/db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, paging } from '../utils/http.js';

const router = Router();

export const PRODUCT_CARD_SQL = `
  SELECT p.id, p.name, p.slug, p.sku, p.short_description, p.color, p.color_hex, p.price, p.mrp, p.stock,
         p.is_featured, p.is_new, p.is_active, p.created_at, c.name AS category_name, c.slug AS category_slug,
         (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image,
         (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1, 1) AS hover_image,
         (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.id AND is_approved = 1) AS rating,
         (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1) AS review_count
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  popular: 'p.is_featured DESC, p.id ASC',
  discount: '(p.mrp - p.price) / p.mrp DESC',
};

router.get('/categories', asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT c.id, c.name, c.slug, c.description, c.image,
       (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
     FROM categories c WHERE c.is_active = 1 ORDER BY c.sort_order, c.name`,
  );
  res.json({ categories: rows });
}));

router.get('/products', asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 12, 48);
  const where = ['p.is_active = 1'];
  const params = [];
  const { category, q, color, minPrice, maxPrice, featured, isNew, inStock } = req.query;
  if (category) { where.push('c.slug = ?'); params.push(category); }
  if (q) {
    where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.color LIKE ? OR p.fabric LIKE ? OR p.occasion LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (color) {
    const colors = String(color).split(',').filter(Boolean);
    where.push(`p.color IN (${colors.map(() => '?').join(',')})`);
    params.push(...colors);
  }
  if (minPrice) { where.push('p.price >= ?'); params.push(Number(minPrice)); }
  if (maxPrice) { where.push('p.price <= ?'); params.push(Number(maxPrice)); }
  if (featured === '1') where.push('p.is_featured = 1');
  if (isNew === '1') where.push('p.is_new = 1');
  if (inStock === '1') where.push('p.stock > 0');
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const order = SORTS[req.query.sort] || SORTS.newest;
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`, params);
  const products = await query(`${PRODUCT_CARD_SQL} ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ products, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/products/filters', asyncHandler(async (_req, res) => {
  const colors = await query(
    'SELECT color AS name, MIN(color_hex) AS hex, COUNT(*) AS count FROM products WHERE is_active = 1 AND color IS NOT NULL GROUP BY color ORDER BY color',
  );
  const [range] = await query('SELECT MIN(price) AS min, MAX(price) AS max FROM products WHERE is_active = 1');
  res.json({ colors, price: range });
}));

router.get('/products/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const [product] = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p
     LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = ? AND p.is_active = 1`,
    [req.params.slug],
  );
  if (!product) throw new HttpError(404, 'Product not found');
  product.images = await query('SELECT id, url FROM product_images WHERE product_id = ? ORDER BY sort_order', [product.id]);
  product.reviews = await query(
    `SELECT r.id, r.rating, r.title, r.comment, r.created_at, u.name AS user_name FROM reviews r
     JOIN users u ON u.id = r.user_id WHERE r.product_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC`,
    [product.id],
  );
  const ratings = product.reviews.map((r) => r.rating);
  product.rating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;
  product.related = await query(
    `${PRODUCT_CARD_SQL} WHERE p.is_active = 1 AND p.id <> ? ORDER BY (p.category_id <=> ?) DESC, (p.color = ?) DESC, p.is_featured DESC LIMIT 4`,
    [product.id, product.category_id, product.color],
  );
  if (req.user) {
    const [w] = await query('SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, product.id]);
    product.in_wishlist = Boolean(w);
  }
  res.json({ product });
}));

router.post('/products/:id/reviews', requireAuth, asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Please choose a rating between 1 and 5');
  const [product] = await query('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (!product) throw new HttpError(404, 'Product not found');
  await query(
    `INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), comment = VALUES(comment), is_approved = 0`,
    [product.id, req.user.id, Math.round(rating), req.body.title || null, req.body.comment || null],
  );
  res.status(201).json({ message: 'Thank you! Your review will appear once approved.' });
}));

export default router;
