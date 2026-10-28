'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Banknote, Check, CreditCard, Lock, Tag, X } from 'lucide-react';
import AddressFields, { EMPTY_ADDRESS } from '@/components/store/AddressFields';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { api, img } from '@/lib/api';
import { inr } from '@/lib/format';
import { openRazorpay } from '@/lib/razorpay';

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, ready, clear } = useCart();
  const toast = useToast();
  const router = useRouter();

  const [config, setConfig] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('new');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [method, setMethod] = useState('razorpay');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/checkout');
  }, [loading, user, router]);

  useEffect(() => {
    api('/config').then((c) => {
      setConfig(c);
      if (!c.razorpayKeyId && c.codEnabled) setMethod('cod');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api('/account/addresses').then((d) => {
      setAddresses(d.addresses);
      if (d.addresses.length) setAddressId(String(d.addresses[0].id));
      else setAddress((a) => ({ ...a, name: user.name || '', phone: user.phone || '' }));
    }).catch(() => {});
  }, [user]);

  const cartKey = items.map((i) => `${i.productId}:${i.qty}`).join(',');
  useEffect(() => {
    if (!ready || !items.length) return;
    api('/cart/quote', { method: 'POST', body: { items: items.map((i) => ({ productId: i.productId, qty: i.qty })), couponCode: coupon } })
      .then((q) => { setQuote(q); setQuoteError(''); })
      .catch((err) => {
        if (coupon) {
          setCoupon(null);
          toast(err.message, 'error');
        } else setQuoteError(err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, coupon, ready]);

  const applyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) setCoupon(couponInput.trim().toUpperCase());
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      let shipTo = address;
      if (addressId !== 'new') {
        shipTo = addresses.find((a) => String(a.id) === addressId);
      } else if (saveAddress) {
        await api('/account/addresses', { method: 'POST', body: address }).catch(() => {});
      }
      const d = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          address: shipTo,
          couponCode: coupon,
          paymentMethod: method,
          notes,
        },
      });

      if (method === 'cod') {
        clear();
        router.push(`/order/${d.order.id}?placed=1`);
        return;
      }

      try {
        const resp = await openRazorpay(d.razorpay);
        await api('/payments/verify', { method: 'POST', body: resp });
        clear();
        router.push(`/order/${d.order.id}?placed=1`);
      } catch (err) {
        if (err.failed) await api('/payments/failed', { method: 'POST', body: { razorpay_order_id: d.razorpay.orderId } }).catch(() => {});
        clear();
        toast(err.dismissed ? 'Payment not completed. You can retry from your order page.' : err.message, 'error');
        router.push(`/order/${d.order.id}`);
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (loading || !user || !ready) return <div className="flex justify-center py-32 text-maroon-700"><Spinner className="h-8 w-8" /></div>;

  if (!items.length) {
    return (
      <div className="container py-28 text-center">
        <h1 className="font-display text-4xl">Your bag is empty</h1>
        <Link href="/shop" className="btn-primary mt-8">Shop Sarees</Link>
      </div>
    );
  }

  const canRazorpay = Boolean(config?.razorpayKeyId);

  return (
    <div className="container py-12 lg:py-16">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Checkout</h1>
      <div className="gold-divider !mx-0" />

      <form onSubmit={placeOrder} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-8">
          <section className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 font-display text-2xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 font-sans text-sm text-cream-light">1</span>
              Shipping Address
            </h2>
            {addresses.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`cursor-pointer rounded-2xl border-2 p-4 text-sm transition ${addressId === String(a.id) ? 'border-maroon-600 bg-maroon-50/50' : 'border-gold-200 hover:border-gold-400'}`}>
                    <input type="radio" name="addr" className="sr-only" checked={addressId === String(a.id)} onChange={() => setAddressId(String(a.id))} />
                    <p className="font-medium text-maroon-900">{a.name}</p>
                    <p className="mt-1 text-ink-soft">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} – {a.pincode}</p>
                    <p className="mt-1 text-ink-muted">{a.phone}</p>
                  </label>
                ))}
                <label className={`flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed p-4 text-sm font-medium transition ${addressId === 'new' ? 'border-maroon-600 text-maroon-700' : 'border-gold-300 text-ink-soft hover:border-gold-500'}`}>
                  <input type="radio" name="addr" className="sr-only" checked={addressId === 'new'} onChange={() => setAddressId('new')} />
                  + Add a new address
                </label>
              </div>
            )}
            {addressId === 'new' && (
              <div className="mt-6">
                <AddressFields value={address} onChange={setAddress} />
                <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-maroon-700" />
                  Save this address for next time
                </label>
              </div>
            )}
            <div className="mt-6">
              <label className="label" htmlFor="notes">Order notes (optional)</label>
              <textarea id="notes" rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gift message, delivery instructions…" />
            </div>
          </section>

          <section className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 font-display text-2xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 font-sans text-sm text-cream-light">2</span>
              Payment Method
            </h2>
            <div className="mt-6 space-y-3">
              <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition ${method === 'razorpay' ? 'border-maroon-600 bg-maroon-50/50' : 'border-gold-200'} ${!canRazorpay ? 'cursor-not-allowed opacity-60' : ''}`}>
                <input type="radio" name="pay" disabled={!canRazorpay} checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} className="mt-1 accent-maroon-700" />
                <CreditCard className="mt-0.5 h-5 w-5 text-maroon-700" />
                <div>
                  <p className="font-medium text-maroon-900">Pay Online — UPI, Cards, Netbanking, Wallets</p>
                  <p className="mt-1 text-xs text-ink-muted">{canRazorpay ? 'Secured by Razorpay. You will be redirected to complete the payment.' : 'Online payment is not configured yet.'}</p>
                </div>
              </label>
              {config?.codEnabled && (
                <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition ${method === 'cod' ? 'border-maroon-600 bg-maroon-50/50' : 'border-gold-200'}`}>
                  <input type="radio" name="pay" checked={method === 'cod'} onChange={() => setMethod('cod')} className="mt-1 accent-maroon-700" />
                  <Banknote className="mt-0.5 h-5 w-5 text-maroon-700" />
                  <div>
                    <p className="font-medium text-maroon-900">Cash on Delivery</p>
                    <p className="mt-1 text-xs text-ink-muted">Pay in cash or UPI when your order arrives.</p>
                  </div>
                </label>
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-gold-200 bg-cream p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Your Order</h2>
          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.productId} className="flex gap-3">
                <div className="relative shrink-0">
                  <img src={img(i.image)} alt="" className="h-20 w-16 rounded-lg object-cover object-top" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-maroon-700 text-[10px] text-cream-light">{i.qty}</span>
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium leading-snug text-maroon-900">{i.name}</p>
                  {i.color && <p className="text-xs text-ink-muted">{i.color}</p>}
                </div>
                <p className="text-sm font-medium">{inr(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-gold-200 pt-5">
            {coupon && quote?.couponCode ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-emerald-800"><Check className="h-4 w-4" /> {quote.couponCode} applied</span>
                <button type="button" onClick={() => { setCoupon(null); setCouponInput(''); }} aria-label="Remove coupon"><X className="h-4 w-4 text-emerald-800" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
                  <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" className="input pl-9 uppercase"
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon(e)} />
                </div>
                <button type="button" onClick={applyCoupon} className="btn-outline btn-sm">Apply</button>
              </div>
            )}
          </div>

          {quoteError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{quoteError}</p>}

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{quote ? inr(quote.subtotal) : '—'}</dd></div>
            {quote?.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>− {inr(quote.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{quote ? (quote.shipping ? inr(quote.shipping) : <span className="text-emerald-700">Free</span>) : '—'}</dd></div>
            <div className="flex justify-between border-t border-gold-200 pt-4">
              <dt className="text-base font-medium">Total</dt>
              <dd className="font-display text-3xl font-semibold text-maroon-900">{quote ? inr(quote.total) : '—'}</dd>
            </div>
          </dl>

          <button disabled={placing || !quote || !!quoteError} className="btn-primary mt-6 w-full py-4 text-base">
            {placing ? <Spinner className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {method === 'cod' ? 'Place Order' : `Pay ${quote ? inr(quote.total) : ''}`}
          </button>
          <p className="mt-3 text-center text-xs text-ink-muted">By placing this order you agree to our <Link href="/policy/terms" className="underline">terms</Link>.</p>
        </aside>
      </form>
    </div>
  );
}
