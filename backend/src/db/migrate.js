/**
 * Brings an existing database up to date with schema.sql without dropping data.
 * Runs on API startup (idempotent) and via `npm run db:migrate`.
 */
import { pathToFileURL } from 'node:url';
import { pool, query } from '../config/db.js';

const ORDER_COLUMNS = {
  courier_name: 'VARCHAR(100) AFTER tracking_number',
  shipment_status: 'VARCHAR(60) AFTER courier_name',
  shiprocket_order_id: 'VARCHAR(30) AFTER shipment_status',
  shiprocket_shipment_id: 'VARCHAR(30) AFTER shiprocket_order_id',
  label_url: 'VARCHAR(500) AFTER shiprocket_shipment_id',
};

export async function migrate() {
  const cols = await query(
    "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'",
  );
  if (!cols.length) return; // tables not created yet — run db:setup
  const have = new Set(cols.map((c) => c.name));
  for (const [name, def] of Object.entries(ORDER_COLUMNS)) {
    if (!have.has(name)) {
      await query(`ALTER TABLE orders ADD COLUMN ${name} ${def}`);
      console.log(`✓ Added orders.${name}`);
    }
  }
  const [idx] = await query(
    "SELECT COUNT(*) AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_tracking'",
  );
  if (!idx.n) await query('ALTER TABLE orders ADD INDEX idx_orders_tracking (tracking_number)');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await migrate();
  console.log('✓ Database is up to date');
  await pool.end();
}
