/**
 * PaymentController — WishCraft
 * Handles plan payment flow via Razorpay, one-time token storage,
 * and UI state management (locked/unlocked/used).
 */

const PLAN_META = {
    basic: { label: 'Basic', price: '₹299', amount: 29900, emoji: '🎈', color: '#64748b' },
    standard: { label: 'Standard', price: '₹499', amount: 49900, emoji: '⭐', color: '#a855f7' },
    premium: { label: 'Premium', price: '₹999', amount: 99900, emoji: '👑', color: '#f59e0b' },
};

const TOKEN_STORAGE_KEY = 'wishcraft_payment_token';
const TOKEN_PLAN_KEY = 'wishcraft_payment_plan';

export class PaymentController {
    constructor(model) {
        this.model = model;
        this._token = localStorage.getItem(TOKEN_STORAGE_KEY) || null;
        this._paidPlan = localStorage.getItem(TOKEN_PLAN_KEY) || null;
        this._onUnlock = null; // callback when payment completes
    }

    /** Register a callback to run after successful payment */
    onUnlock(cb) { this._onUnlock = cb; }

    /** Returns the stored one-time token */
    getToken() { return this._token; }

    /** Whether user has a valid (unused) token for the given plan */
    hasValidToken(plan) {
        return !!this._token && this._paidPlan === plan;
    }

    /** Clear token (called after generation) */
    clearToken() {
        this._token = null;
        this._paidPlan = null;
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_PLAN_KEY);
    }

    /**
     * Initiate payment for selected plan.
     * Calls server to create Razorpay order, then opens checkout.
     */
    async initiatePayment(plan) {
        const meta = PLAN_META[plan];
        if (!meta) { alert('Invalid plan selected.'); return; }

        const btn = document.getElementById(`pay-btn-${plan}`);
        if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

        try {
            // Step 1: Create order on server
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            const orderData = await orderRes.json();

            if (!orderData.success) throw new Error(orderData.error || 'Order creation failed');

            // Step 2: Open Razorpay checkout
            const options = {
                key: orderData.key,
                amount: orderData.order.amount,
                currency: 'INR',
                name: 'WishCraft Studio',
                description: `${meta.label} Plan — One-time Website Generation`,
                image: '/assets/logo.png',
                order_id: orderData.order.id,
                theme: { color: meta.color },
                prefill: { name: this.model.get().recipient?.name || '' },

                handler: async (response) => {
                    await this._verifyPayment(response, plan);
                },

                modal: {
                    ondismiss: () => {
                        if (btn) {
                            btn.disabled = false;
                            btn.textContent = `Pay ${meta.price}`;
                        }
                    },
                },
            };

            if (typeof Razorpay === 'undefined') {
                throw new Error('Razorpay SDK not loaded. Check your internet connection.');
            }

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', (response) => {
                console.error('Payment failed:', response.error);
                alert(`Payment failed: ${response.error.description}`);
                if (btn) { btn.disabled = false; btn.textContent = `Pay ${meta.price}`; }
            });
            rzp.open();

        } catch (err) {
            console.error('Payment initiation error:', err);
            alert(`Payment error: ${err.message}`);
            if (btn) { btn.disabled = false; btn.textContent = `Pay ${meta.price}`; }
        }
    }

    /**
     * Verify payment on server and store the issued one-time token
     */
    async _verifyPayment(response, plan) {
        try {
            const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    plan,
                }),
            });

            const data = await verifyRes.json();
            if (!data.success) throw new Error(data.error || 'Verification failed');

            // Store token locally
            this._token = data.token;
            this._paidPlan = plan;
            localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
            localStorage.setItem(TOKEN_PLAN_KEY, plan);

            console.log(`✅ Payment verified. Plan "${plan}" unlocked.`);

            // Notify app
            if (this._onUnlock) this._onUnlock(plan);
            this._showSuccessToast(plan);

        } catch (err) {
            console.error('Verification error:', err);
            alert(`Payment verification failed: ${err.message}\nPlease contact support with your payment ID.`);
        }
    }

    /** Show a success notification */
    _showSuccessToast(plan) {
        const meta = PLAN_META[plan];
        const toast = document.createElement('div');
        toast.id = 'payment-success-toast';
        toast.innerHTML = `
      <div style="
        position:fixed; top:24px; right:24px; z-index:99999;
        background: linear-gradient(135deg, #10b981, #059669);
        color:#fff; padding:16px 24px; border-radius:14px;
        box-shadow:0 8px 32px rgba(16,185,129,0.4);
        font-family:inherit; font-size:0.95rem; font-weight:600;
        display:flex; align-items:center; gap:12px;
        animation: slideInRight 0.4s ease;
      ">
        <span style="font-size:1.5rem">${meta.emoji}</span>
        <div>
          <div style="font-size:1rem">${meta.label} Plan Unlocked!</div>
          <div style="font-size:0.8rem; opacity:0.85; font-weight:400; margin-top:2px">
            You can now generate your wish website once.
          </div>
        </div>
      </div>
      <style>
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity:0; }
          to   { transform: translateX(0);    opacity:1; }
        }
      </style>
    `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}
