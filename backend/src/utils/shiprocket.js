import { HttpError } from './http.js';

const BASE = 'https://apiv2.shiprocket.in/v1/external';
// Shiprocket tokens last 10 days; refresh a day early.
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

const env = (k, def = '') => (process.env[k] || def).trim().replace(/^['"]|['"]$/g, '');

export const shiprocketConfigured = () => Boolean(env('SHIPROCKET_EMAIL') && env('SHIPROCKET_PASSWORD'));

let token = null;
let tokenExpires = 0;

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env('SHIPROCKET_EMAIL'), password: env('SHIPROCKET_PASSWORD') }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    console.error(`Shiprocket login failed (${res.status}): ${data.message || 'no token returned'}`);
    console.error('→ Use an API user (Shiprocket → Settings → API → Add New API User) in SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD.');
    throw new HttpError(502, 'Could not sign in to Shiprocket. Check the API user credentials in backend/.env');
  }
  token = data.token;
  tokenExpires = Date.now() + TOKEN_TTL_MS;
  return token;
}

/** Calls the Shiprocket API, logging in (and retrying once on 401) as needed. Returns parsed JSON. */
export async function shiprocket(path, { method = 'GET', body } = {}, retried = false) {
  if (!shiprocketConfigured()) {
    throw new HttpError(503, 'Shiprocket is not configured yet. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to backend/.env');
  }
  const auth = token && Date.now() < tokenExpires ? token : await login();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HttpError(502, 'Cannot reach Shiprocket right now. Please try again shortly.');
  }
  if (res.status === 401 && !retried) {
    token = null;
    return shiprocket(path, { method, body }, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Validation errors come back as { message, errors: { field: [msg] } }
    const details = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    const msg = [data.message, details].filter(Boolean).join(' — ') || `Shiprocket error ${res.status}`;
    console.error(`Shiprocket ${method} ${path} failed (${res.status}): ${msg}`);
    throw new HttpError(502, `Shiprocket: ${msg}`);
  }
  return data;
}

/** Package size for an order: per-saree weight, and a box whose height grows with the number of sarees. */
function packageFor(units) {
  const weight = Number(env('SHIPROCKET_ITEM_WEIGHT_KG', '0.6')) || 0.6;
  const [l, b, h] = env('SHIPROCKET_PACKAGE_CM', '35x28x4').split('x').map(Number);
  return { length: l || 35, breadth: b || 28, height: (h || 4) * units, weight: Math.round(weight * units * 100) / 100 };
}

const pad = (n) => String(n).padStart(2, '0');
const srDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Creates the order in Shiprocket. order is the row from getOrderWithItems(). Returns { order_id, shipment_id, ... }. */
export async function createShiprocketOrder(order) {
  const [first, ...rest] = String(order.ship_name).trim().split(/\s+/);
  const units = order.items.reduce((s, i) => s + i.qty, 0);
  const data = await shiprocket('/orders/create/adhoc', {
    method: 'POST',
    body: {
      order_id: order.order_number,
      order_date: srDate(new Date(order.created_at)),
      pickup_location: env('SHIPROCKET_PICKUP_LOCATION', 'Primary'),
      billing_customer_name: first,
      billing_last_name: rest.join(' '),
      billing_address: order.ship_line1,
      billing_address_2: order.ship_line2 || '',
      billing_city: order.ship_city,
      billing_pincode: order.ship_pincode,
      billing_state: order.ship_state,
      billing_country: 'India',
      billing_email: order.ship_email || '',
      billing_phone: String(order.ship_phone).replace(/\D/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: order.items.map((i) => ({
        name: i.name,
        sku: i.sku || `ITEM-${i.id}`,
        units: i.qty,
        selling_price: Number(i.price),
      })),
      payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      shipping_charges: Number(order.shipping),
      total_discount: Number(order.discount),
      sub_total: Number(order.subtotal),
      ...packageFor(units),
    },
  });
  if (!data.shipment_id) throw new HttpError(502, `Shiprocket did not create a shipment: ${data.message || 'unknown reason'}`);
  return data;
}

/** Assigns a courier + AWB. Without courierId Shiprocket picks the recommended courier. */
export async function assignAwb(shipmentId, courierId) {
  const data = await shiprocket('/courier/assign/awb', {
    method: 'POST',
    body: { shipment_id: shipmentId, ...(courierId ? { courier_id: courierId } : {}) },
  });
  const awb = data.response?.data;
  if (data.awb_assign_status !== 1 || !awb?.awb_code) {
    const reason = awb?.awb_assign_error || data.message || 'no courier available';
    throw new HttpError(502, `Shiprocket could not assign a courier: ${reason}`);
  }
  return { awb: awb.awb_code, courierName: awb.courier_name };
}

export async function schedulePickup(shipmentId) {
  try {
    return await shiprocket('/courier/generate/pickup', { method: 'POST', body: { shipment_id: [shipmentId] } });
  } catch (err) {
    // Re-running the flow on a shipment that is already queued for pickup is fine.
    if (/already/i.test(err.message)) return null;
    throw err;
  }
}

export async function generateLabel(shipmentId) {
  const data = await shiprocket('/courier/generate/label', { method: 'POST', body: { shipment_id: [shipmentId] } });
  return data.label_url || null;
}

export async function cancelShiprocketOrder(srOrderId) {
  return shiprocket('/orders/cancel', { method: 'POST', body: { ids: [Number(srOrderId)] } });
}

/** Latest courier status for an AWB, e.g. "IN TRANSIT". */
export async function trackAwb(awb) {
  const data = await shiprocket(`/courier/track/awb/${encodeURIComponent(awb)}`);
  const t = data.tracking_data || {};
  return t.shipment_track?.[0]?.current_status || t.shipment_track_activities?.[0]?.['sr-status-label'] || null;
}

export const trackingUrl = (awb) => (awb ? `https://shiprocket.co/tracking/${encodeURIComponent(awb)}` : null);

/**
 * Maps a Shiprocket shipment status to our order status, or null when the order status should not change
 * (pre-pickup states, RTO, courier-side cancellations — those need a human decision).
 */
export function orderStatusFor(shipmentStatus) {
  const s = String(shipmentStatus || '').toUpperCase();
  if (!s || s.includes('RTO') || s.includes('CANCEL') || s.includes('LOST') || s.includes('DAMAGED')) return null;
  if (s === 'DELIVERED') return 'delivered';
  if (/PICKED UP|SHIPPED|IN TRANSIT|OUT FOR DELIVERY|REACHED|UNDELIVERED|DELAYED|MISROUTED/.test(s)) return 'shipped';
  return null;
}
