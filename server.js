const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const archiver = require('archiver');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.use(session({
  secret: 'scrapcraft-super-secret-key-1234',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

const usersFile = path.join(__dirname, 'data', 'users.json');

// Ensure users file exists
async function initUsers() {
  await fs.ensureDir(path.join(__dirname, 'data'));
  if (!await fs.pathExists(usersFile)) {
    // Create default admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await fs.writeJson(usersFile, [{ email: 'admin@scrapcraft.com', password: hashedAdminPassword, role: 'admin' }], { spaces: 2 });
  }
}
initUsers();

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const users = await fs.readJson(usersFile);
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { email, password: hashedPassword, role: 'user' };
  users.push(newUser);
  await fs.writeJson(usersFile, users, { spaces: 2 });

  req.session.user = { email: newUser.email, role: newUser.role };
  res.json({ success: true, user: req.session.user });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const users = await fs.readJson(usersFile);
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.user = { email: user.email, role: user.role };
  res.json({ success: true, user: req.session.user });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Middleware to check auth before generating
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required to generate websites' });
  }
  next();
};

// Serve static assets & root index
app.use('/', express.static(path.join(__dirname, '/')));

// API: Generate website
app.post('/api/generate', requireAuth, async (req, res) => {
  try {
    const configData = req.body;
    const name = configData.recipient?.name || 'celebration';
    const wishType = configData.wishType || 'birthday';
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${cleanName}-${wishType}-${Date.now().toString().slice(-4)}`;

    const generatedDir = path.join(__dirname, 'generated', slug);
    const templateDir = path.join(__dirname, 'template');

    await fs.remove(generatedDir);
    await fs.copy(templateDir, generatedDir);
    await fs.writeJson(path.join(generatedDir, 'config.json'), configData, { spaces: 2 });

    console.log(`🎉 Celebration website created: ${slug}`);

    res.json({
      success: true,
      message: 'Website generated successfully!',
      url: `${HOST}/generated/${slug}/index.html`,
      slug,
      downloadUrl: `${HOST}/api/download/${slug}`
    });
  } catch (error) {
    console.error('Error generating website:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// API: Download ZIP bundle
app.get('/api/download/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const generatedDir = path.join(__dirname, 'generated', slug);

    if (!await fs.pathExists(generatedDir)) {
      return res.status(404).json({ error: 'Celebration page not found' });
    }

    res.attachment(`${slug}-scrapcraft.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', err => {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    archive.directory(generatedDir, false);
    await archive.finalize();
  } catch (error) {
    console.error('Error creating zip bundle:', error);
    res.status(500).json({ error: 'Failed to download zip package' });
  }
});

// API: Get history
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
          downloadUrl: `${HOST}/api/download/${file}`
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

app.listen(PORT, () => {
  console.log(`✨ Scrapbook Celebration App running at http://localhost:${PORT}`);
});
