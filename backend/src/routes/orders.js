import { Router } from 'express';
import { query, transaction } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, isEmail, paging } from '../utils/http.js';
import { evaluateCoupon, getOrderWithItems, newOrderNumber, priceCart, releaseStock, reserveStock, storeRules } from '../utils/orders.js';
import { createRazorpayOrder, razorpay, razorpayConfigured, razorpayKeyId, verifyPaymentSignature } from '../utils/razorpay.js';
import { validateAddress } from './account.js';

const router = Router();

/** Public store config the checkout needs. */
router.get('/config', (_req, res) => {
  res.json({ ...storeRules(), razorpayKeyId: razorpayConfigured() ? razorpayKeyId() : null });
});

router.post('/coupons/validate', asyncHandler(async (req, res) => {
  const subtotal = Number(req.body.subtotal) || 0;
  const { coupon, discount } = await evaluateCoupon(req.body.code || '', subtotal);
  res.json({ code: coupon.code, description: coupon.description, discount });
}));

/** Prices the cart server-side (used by the cart/checkout pages). */
router.post('/cart/quote', asyncHandler(async (req, res) => {
  const quote = await priceCart(req.body.items, req.body.couponCode);
  res.json(quote);
}));

router.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  const { items, address, couponCode, paymentMethod, notes } = req.body;
  if (!['razorpay', 'cod'].includes(paymentMethod)) throw new HttpError(400, 'Please choose a payment method');
  if (paymentMethod === 'cod' && !storeRules().codEnabled) throw new HttpError(400, 'Cash on delivery is currently unavailable');
  if (paymentMethod === 'razorpay') razorpay(); // throws a helpful error early if keys are missing
  validateAddress(address || {});
  const email = address.email && isEmail(address.email) ? address.email : req.user.email;

  const order = await transaction(async (q) => {
    const quote = await priceCart(items, couponCode, q);
    const orderNumber = newOrderNumber();
    const r = await q(
      `INSERT INTO orders (order_number, user_id, status, payment_method, subtotal, discount, shipping, total, coupon_code,
        ship_name, ship_phone, ship_email, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, req.user.id, paymentMethod === 'cod' ? 'confirmed' : 'pending', paymentMethod, quote.subtotal, quote.discount,
        quote.shipping, quote.total, quote.couponCode, address.name, address.phone, email, address.line1, address.line2 || null,
        address.city, address.state, address.pincode, notes ? String(notes).slice(0, 500) : null],
    );
    for (const l of quote.lines) {
      await q('INSERT INTO order_items (order_id, product_id, name, sku, image, price, qty) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        r.insertId, l.productId, l.name, l.sku, l.image, l.price, l.qty,
      ]);
    }
    if (paymentMethod === 'cod') await reserveStock(r.insertId, q);
    return { id: r.insertId, orderNumber, total: quote.total };
  });

  if (paymentMethod === 'cod') {
    return res.status(201).json({ order: await getOrderWithItems(order.id) });
  }

  let rzpOrder;
  try {
    rzpOrder = await createRazorpayOrder({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { order_id: String(order.id) },
    });
  } catch (err) {
    await query("UPDATE orders SET payment_status = 'failed' WHERE id = ?", [order.id]);
    throw err;
  }
  await query('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rzpOrder.id, order.id]);
  res.status(201).json({
    order: await getOrderWithItems(order.id),
    razorpay: {
      keyId: razorpayKeyId(),
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: 'Madhuri Sarees',
      prefill: { name: address.name, email, contact: address.phone },
    },
  });
}));

/** Marks an order paid after Razorpay checkout succeeds. Shared by verify + webhook. */
export async function markOrderPaid(razorpayOrderId, paymentId) {
  return transaction(async (q) => {
    const [order] = await q('SELECT id, payment_status FROM orders WHERE razorpay_order_id = ? FOR UPDATE', [razorpayOrderId]);
    if (!order) return null;
    if (order.payment_status !== 'paid') {
      await q("UPDATE orders SET payment_status = 'paid', status = IF(status = 'pending', 'confirmed', status), razorpay_payment_id = ? WHERE id = ?", [
        paymentId, order.id,
      ]);
      await reserveStock(order.id, q);
    }
    return order.id;
  });
}

router.post('/payments/verify', requireAuth, asyncHandler(async (req, res) => {
  const { razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  if (!rzpOrderId || !paymentId || !signature) throw new HttpError(400, 'Incomplete payment details');
  razorpay(); // ensures keys are configured before verifying
  const [order] = await query('SELECT id FROM orders WHERE razorpay_order_id = ? AND user_id = ?', [rzpOrderId, req.user.id]);
  if (!order) throw new HttpError(404, 'Order not found');
  if (!verifyPaymentSignature(rzpOrderId, paymentId, signature)) {
    await query("UPDATE orders SET payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'", [order.id]);
    throw new HttpError(400, 'Payment verification failed. If money was deducted it will be refunded automatically.');
  }
  await markOrderPaid(rzpOrderId, paymentId);
  res.json({ order: await getOrderWithItems(order.id) });
}));

router.post('/payments/failed', requireAuth, asyncHandler(async (req, res) => {
  await query("UPDATE orders SET payment_status = 'failed' WHERE razorpay_order_id = ? AND user_id = ? AND payment_status = 'pending'", [
    req.body.razorpay_order_id, req.user.id,
  ]);
  res.json({ ok: true });
}));

/** Lets a customer retry payment on an unpaid Razorpay order. */
router.post('/orders/:id/pay', requireAuth, asyncHandler(async (req, res) => {
  const order = await getOrderWithItems(req.params.id, req.user.id);
  if (order.payment_method !== 'razorpay' || order.payment_status === 'paid' || order.status === 'cancelled') {
    throw new HttpError(400, 'This order cannot be paid online');
  }
  // make sure items are still in stock before taking money
  await priceCart(order.items.map((i) => ({ productId: i.product_id, qty: i.qty })));
  const rzpOrder = await createRazorpayOrder({ amount: Math.round(Number(order.total) * 100), currency: 'INR', receipt: order.order_number });
  await query("UPDATE orders SET razorpay_order_id = ?, payment_status = 'pending' WHERE id = ?", [rzpOrder.id, order.id]);
  res.json({
    order,
    razorpay: {
      keyId: razorpayKeyId(), orderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, name: 'Madhuri Sarees',
      prefill: { name: order.ship_name, email: order.ship_email, contact: order.ship_phone },
    },
  });
}));

router.get('/orders', requireAuth, asyncHandler(async (req, res) => {
  const { limit, offset, page } = paging(req, 10, 50);
  const orders = await query(
    `SELECT o.id, o.order_number, o.status, o.payment_method, o.payment_status, o.total, o.created_at,
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
       (SELECT image FROM order_items WHERE order_id = o.id LIMIT 1) AS image
     FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset],
  );
  const [{ total }] = await query('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [req.user.id]);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/orders/:id', requireAuth, asyncHandler(async (req, res) => {
  res.json({ order: await getOrderWithItems(req.params.id, req.user.id) });
}));

router.post('/orders/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const order = await getOrderWithItems(req.params.id, req.user.id);
  if (!['pending', 'confirmed'].includes(order.status)) throw new HttpError(400, 'This order can no longer be cancelled');
  await transaction(async (q) => {
    await q("UPDATE orders SET status = 'cancelled' WHERE id = ?", [order.id]);
    await releaseStock(order.id, q);
  });
  res.json({ order: await getOrderWithItems(order.id) });
}));

export default router;
