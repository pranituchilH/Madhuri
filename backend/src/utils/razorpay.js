import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { HttpError } from './http.js';

let client;

// Tolerate stray spaces/quotes copied from the dashboard into .env
const env = (k) => (process.env[k] || '').trim().replace(/^['"]|['"]$/g, '');
const keyId = () => env('RAZORPAY_KEY_ID');
const keySecret = () => env('RAZORPAY_KEY_SECRET');

export const razorpayConfigured = () =>
  Boolean(keyId() && keySecret() && !keyId().includes('xxxx'));

export function razorpay() {
  if (!razorpayConfigured()) {
    throw new HttpError(503, 'Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env');
  }
  client ||= new Razorpay({ key_id: keyId(), key_secret: keySecret() });
  return client;
}

export const razorpayKeyId = keyId;

/** Creates a Razorpay order, turning gateway errors into a clear message for the shopper and the logs. */
export async function createRazorpayOrder(params) {
  try {
    return await razorpay().orders.create(params);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const desc = err?.error?.description || err?.message || 'Unknown error';
    console.error(`Razorpay order creation failed (${err?.statusCode}): ${desc}`);
    if (err?.statusCode === 401) {
      console.error('→ Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env: they must be a matching pair from the same mode (test/live).');
    }
    throw new HttpError(502, 'Online payment is temporarily unavailable. Please try again shortly or choose Cash on Delivery.');
  }
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', keySecret()).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}
