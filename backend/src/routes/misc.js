import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { query } from '../config/db.js';
import { asyncHandler, HttpError, isEmail, required } from '../utils/http.js';
import { verifyWebhookSignature } from '../utils/razorpay.js';
import { markOrderPaid } from './orders.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post('/newsletter', limiter, asyncHandler(async (req, res) => {
  if (!isEmail(req.body.email)) throw new HttpError(400, 'Please enter a valid email address');
  await query('INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)', [String(req.body.email).trim().toLowerCase()]);
  res.status(201).json({ message: 'Thank you for subscribing!' });
}));

router.post('/contact', limiter, asyncHandler(async (req, res) => {
  required(req.body, ['name', 'email', 'message']);
  if (!isEmail(req.body.email)) throw new HttpError(400, 'Please enter a valid email address');
  const { name, email, phone, subject, message } = req.body;
  await query('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)', [
    name, email, phone || null, subject || null, String(message).slice(0, 5000),
  ]);
  res.status(201).json({ message: 'Thanks for reaching out — we will get back to you within 24 hours.' });
}));

/** Razorpay webhook (configure URL: <api>/api/payments/webhook, event: payment.captured / order.paid). */
export async function razorpayWebhook(req, res) {
  if (!verifyWebhookSignature(req.body, req.headers['x-razorpay-signature'])) return res.status(400).json({ message: 'Invalid signature' });
  const event = JSON.parse(req.body.toString('utf8'));
  const payment = event.payload?.payment?.entity;
  if (['payment.captured', 'order.paid'].includes(event.event) && payment?.order_id) {
    await markOrderPaid(payment.order_id, payment.id);
  }
  res.json({ ok: true });
}

export default router;
