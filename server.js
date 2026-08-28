const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const archiver = require('archiver');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST_URL || `http://localhost:${PORT}`;

// ─── ADMIN AUTH CONFIG ──────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wishcraft2024';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// ─── RAZORPAY CONFIG ────────────────────────────────────────────────
// Replace with your actual keys from https://dashboard.razorpay.com/
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_ID';
const RAZORPAY_KEY_SECRET = 'YOUR_KEY_SECRET';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ─── PLAN PRICING (in paise, 100 paise = ₹1) ────────────────────────
const PLAN_PRICES = {
  basic: 29900,   // ₹299
  standard: 49900,   // ₹499
  premium: 99900,   // ₹999
};

// ─── IN-MEMORY ONE-TIME TOKEN STORE ─────────────────────────────────
// In production, replace with a database (MongoDB, SQLite, etc.)
// token → { plan, used, createdAt, orderId, paymentId }
const tokenStore = new Map();

// ─── MIDDLEWARE ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── SESSION MIDDLEWARE ──────────────────────────────────────────────
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ─── ADMIN AUTH MIDDLEWARE ───────────────────────────────────────────
// Protects all /admin/ routes except login.html
app.use('/admin', (req, res, next) => {
  const publicPaths = ['/login.html', '/login'];
  if (publicPaths.includes(req.path)) return next();
  if (req.session?.adminAuthenticated) return next();
  return res.redirect('/admin/login.html');
});

// ─── ADMIN LOGIN / LOGOUT ROUTES ─────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
});

app.get('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login.html');
});
app.use('/', express.static(path.join(__dirname, '/')));

// ─── PAYMENT ROUTES ──────────────────────────────────────────────────

/**
 * Step 1: Create a Razorpay order when user initiates payment
 * POST /api/payment/create-order
 * Body: { plan: 'basic' | 'standard' | 'premium' }
 */
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ success: false, error: 'Invalid plan selected.' });
    }

    const order = await razorpay.orders.create({
      amount: PLAN_PRICES[plan],
      currency: 'INR',
      receipt: `wishcraft_${plan}_${Date.now()}`,
      notes: { plan },
    });

    res.json({ success: true, order, key: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ success: false, error: 'Could not create payment order.' });
  }
});

/**
 * Step 2: Verify payment signature and issue a one-time token
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
 */
app.post('/api/payment/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    // HMAC-SHA256 verification
    const expectedSig = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed. Invalid signature.' });
    }

    // Generate one-time access token
    const token = crypto.randomBytes(32).toString('hex');
    tokenStore.set(token, {
      plan,
      used: false,
      createdAt: new Date().toISOString(),
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    console.log(`✅ Payment verified for plan: ${plan}. Token issued: ${token.slice(0, 8)}...`);
    res.json({ success: true, token, plan });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, error: 'Verification failed.' });
  }
});

/**
 * Check token validity without consuming it
 * GET /api/payment/token-status?token=xxx
 */
app.get('/api/payment/token-status', (req, res) => {
  const { token } = req.query;
  const entry = tokenStore.get(token);

  if (!entry) {
    return res.json({ valid: false, reason: 'Token not found.' });
  }
  if (entry.used) {
    return res.json({ valid: false, reason: 'This token has already been used to generate a website.' });
  }
  res.json({ valid: true, plan: entry.plan });
});

// ─── GENERATE ROUTE (now token-gated) ───────────────────────────────

/**
 * Generate website — requires a valid one-time token
 * POST /api/generate
 * Body: { ...configData, _token: '<one-time-token>' }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { _token, ...configData } = req.body;

    // ── Token validation ──
    const entry = tokenStore.get(_token);

    if (!entry) {
      return res.status(403).json({ success: false, error: 'Access denied. No valid payment token provided.' });
    }
    if (entry.used) {
      return res.status(403).json({ success: false, error: 'This token has already been used. Each payment allows one website generation.' });
    }
    if (entry.plan !== configData.plan) {
      return res.status(403).json({ success: false, error: `Token is for plan "${entry.plan}" but you selected "${configData.plan}".` });
    }

    // ── Mark token as consumed ──
    entry.used = true;
    entry.usedAt = new Date().toISOString();

    // ── Generate the website ──
    const name = configData.recipient?.name || 'unknown';
    const wishType = configData.wishType || 'birthday';
    const age = configData.recipient?.age;
    const agePart = wishType === 'birthday' && age ? `-${age}` : '';
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${wishType}${agePart}`;

    const generatedDir = path.join(__dirname, 'generated', slug);
    const templateDir = path.join(__dirname, 'template');

    await fs.remove(generatedDir);
    await fs.copy(templateDir, generatedDir);
    await fs.writeJson(path.join(generatedDir, 'config.json'), configData, { spaces: 2 });

    console.log(`🎉 Website generated: ${slug} (plan: ${entry.plan})`);

    res.json({
      success: true,
      message: 'Website generated successfully!',
      url: `${HOST}/generated/${slug}/index.html`,
    });
  } catch (error) {
    console.error('Error generating website:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ─── HISTORY & DOWNLOAD (unchanged) ─────────────────────────────────

app.get('/api/history', async (req, res) => {
  try {
    const generatedDir = path.join(__dirname, 'generated');
    if (!await fs.pathExists(generatedDir)) return res.json({ history: [] });

    const files = await fs.readdir(generatedDir);
    const history = [];

    for (const file of files) {
      const fullPath = path.join(generatedDir, file);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        history.push({
          slug: file,
          createdAt: stat.birthtime,
          url: `${HOST}/generated/${file}/index.html`,
        });
      }
    }
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/download/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const targetDir = path.join(__dirname, 'generated', slug);

    if (!await fs.pathExists(targetDir)) return res.status(404).send('Not found');

    res.attachment(`${slug}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => res.status(500).send({ error: err.message }));
    archive.pipe(res);
    archive.directory(targetDir, false);
    archive.finalize();
  } catch (error) {
    console.error('Error zipping directory:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ─── START ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`WishCraft Backend running at http://localhost:${PORT}`);
  console.log(`Razorpay Key ID: ${RAZORPAY_KEY_ID}`);
});
