/** Loads Razorpay Checkout and resolves with the payment response, or rejects on dismiss/failure. */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export async function openRazorpay(rzp) {
  const ok = await loadRazorpayScript();
  if (!ok) throw new Error('Could not load Razorpay. Please check your connection.');
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: rzp.keyId,
      amount: rzp.amount,
      currency: rzp.currency,
      name: rzp.name,
      description: 'Madhuri Sarees order',
      image: `${window.location.origin}/favicon.png`,
      order_id: rzp.orderId,
      prefill: rzp.prefill,
      theme: { color: '#741331' },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(Object.assign(new Error('Payment was cancelled'), { dismissed: true })) },
    });
    checkout.on('payment.failed', (r) => reject(Object.assign(new Error(r.error?.description || 'Payment failed'), { failed: true })));
    checkout.open();
  });
}
