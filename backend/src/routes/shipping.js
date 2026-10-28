import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/http.js';
import { applyShipmentStatus } from '../utils/orders.js';

const router = Router();

function validToken(header) {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN || '';
  if (!expected || !header) return false;
  const a = Buffer.from(String(header));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Shiprocket tracking webhook (Settings → API → Webhooks). URL: <api>/api/shipping/webhook,
 * token: SHIPROCKET_WEBHOOK_TOKEN (sent back to us in the x-api-key header).
 */
router.post('/webhook', asyncHandler(async (req, res) => {
  if (!validToken(req.headers['x-api-key'])) return res.status(401).json({ message: 'Invalid token' });
  const { awb, sr_order_id: srOrderId, current_status: currentStatus, shipment_status: shipmentStatus, courier_name: courier } = req.body || {};
  const [order] = awb
    ? await query('SELECT id FROM orders WHERE tracking_number = ? LIMIT 1', [String(awb)])
    : srOrderId
      ? await query('SELECT id FROM orders WHERE shiprocket_order_id = ? LIMIT 1', [String(srOrderId)])
      : [];
  if (order) {
    if (courier) await query('UPDATE orders SET courier_name = COALESCE(courier_name, ?) WHERE id = ?', [courier, order.id]);
    await applyShipmentStatus(order.id, currentStatus || shipmentStatus);
  }
  // Always 200 for authenticated calls so Shiprocket does not keep retrying events for orders we don't know.
  res.json({ ok: true });
}));

export default router;
