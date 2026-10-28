/**
 * Creates all tables (dropping existing ones) and optionally seeds demo data.
 *   npm run db:setup   -> schema + admin user
 *   npm run db:seed    -> schema + admin user + categories, products, coupons
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { categories, products, coupons } from './seed-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withSeed = process.argv.includes('--seed');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
});

await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`USE \`${process.env.DB_NAME}\``);
await conn.query(await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8'));
console.log('✓ Schema created');

const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
await conn.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")', [
  process.env.ADMIN_NAME || 'Admin',
  process.env.ADMIN_EMAIL || 'admin@madhurisarees.com',
  hash,
]);
console.log(`✓ Admin user: ${process.env.ADMIN_EMAIL}`);

if (withSeed) {
  const catIds = {};
  for (const [i, c] of categories.entries()) {
    const [r] = await conn.query('INSERT INTO categories (name, slug, description, image, sort_order) VALUES (?, ?, ?, ?, ?)', [
      c.name, c.slug, c.description, c.image, i,
    ]);
    catIds[c.slug] = r.insertId;
  }
  for (const p of products) {
    const [r] = await conn.query(
      `INSERT INTO products (category_id, name, slug, sku, short_description, description, fabric, color, color_hex, occasion, work,
        price, mrp, stock, is_featured, is_new) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [catIds[p.category], p.name, p.slug, p.sku, p.short, p.description, p.fabric, p.color, p.colorHex, p.occasion, p.work,
        p.price, p.mrp, p.stock, p.featured ? 1 : 0, p.isNew ? 1 : 0],
    );
    for (let i = 1; i <= p.images; i++) {
      await conn.query('INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)', [r.insertId, `/uploads/products/${p.slug}-${i}.jpg`, i]);
    }
  }
  for (const c of coupons) {
    await conn.query('INSERT INTO coupons (code, description, type, value, min_order, max_discount) VALUES (?, ?, ?, ?, ?, ?)', [
      c.code, c.description, c.type, c.value, c.minOrder, c.maxDiscount,
    ]);
  }
  console.log(`✓ Seeded ${categories.length} categories, ${products.length} products, ${coupons.length} coupons`);
}

await conn.end();
