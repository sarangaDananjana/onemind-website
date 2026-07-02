const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'messages.json');

// ── Reimagine Config ──
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'onemind2026';
const CLIENTS_FILE = path.join(__dirname, 'data', 'clients.json');
const REPLIES_FILE = path.join(__dirname, 'data', 'replies.json');
const REIMAGINED_DIR = path.join(__dirname, 'data', 'reimagined');
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'hello@onemindsolutions.com';

// ── Session store (in-memory, resets on restart — fine for admin) ──
const sessions = new Map();

// ── Multer setup (memory storage, max 10MB per file) ──
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ── Nodemailer setup (optional — only sends if SMTP_USER is set) ──
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('📧 Email notifications enabled via SMTP');
} else {
    console.log('📧 Email notifications disabled (SMTP_USER/SMTP_PASS not set). Replies saved to file only.');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// THIS LINE SERVES YOUR HTML FRONTEND
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'projects')));

// Serve reimagine asset files from data/reimagined/
app.use('/reimagine-assets', express.static(REIMAGINED_DIR));

// Ensure data directories exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(REIMAGINED_DIR)) {
    fs.mkdirSync(REIMAGINED_DIR, { recursive: true });
}

// ══════════════════════════════════════════════════════════════
// EXISTING: Contact Form API
// ══════════════════════════════════════════════════════════════

app.post('/api/contact', (req, res) => {
    const { name, company, email, brief, budget } = req.body;

    if (!name || !email || !brief) {
        return res.status(400).json({ error: 'Name, email, and brief are required.' });
    }

    const newMessage = {
        timestamp: new Date().toISOString(),
        name, company, email, brief, budget
    };

    fs.appendFile(DB_FILE, JSON.stringify(newMessage) + '\n', (err) => {
        if (err) return res.status(500).json({ error: 'Internal server error' });
        res.status(200).json({ success: true, message: 'Message saved successfully.' });
    });
});

// ══════════════════════════════════════════════════════════════
// REIMAGINE FEATURE: Helpers
// ══════════════════════════════════════════════════════════════

function readJSON(filePath) {
    try {
        if (!fs.existsSync(filePath)) return [];
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch { return []; }
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateSlug(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
}

function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

async function sendNotificationEmail(clientName, slug, replyData) {
    if (!transporter) return;
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: NOTIFY_EMAIL,
            subject: `🎉 New Reimagine Interest — ${clientName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; background: #0C0C0E; color: #F4F4F5; border-radius: 8px;">
                    <h2 style="color: #0047FF; margin-bottom: 16px;">New Reimagine Interest!</h2>
                    <p style="color: #9CA3AF; margin-bottom: 24px;">A potential client has expressed interest in their reimagined website.</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="color: #6B7280; padding: 8px 0; border-bottom: 1px solid #222;">Client</td><td style="color: #F4F4F5; padding: 8px 0; border-bottom: 1px solid #222;">${clientName}</td></tr>
                        <tr><td style="color: #6B7280; padding: 8px 0; border-bottom: 1px solid #222;">Name</td><td style="color: #F4F4F5; padding: 8px 0; border-bottom: 1px solid #222;">${replyData.name}</td></tr>
                        <tr><td style="color: #6B7280; padding: 8px 0; border-bottom: 1px solid #222;">Phone</td><td style="color: #F4F4F5; padding: 8px 0; border-bottom: 1px solid #222;">${replyData.phone}</td></tr>
                        <tr><td style="color: #6B7280; padding: 8px 0;">Message</td><td style="color: #00D47E; padding: 8px 0;">"Yes, I'm in — give me more details!"</td></tr>
                    </table>
                    <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">Slug: ${slug} · ${new Date().toISOString()}</p>
                </div>
            `
        });
        console.log(`📧 Interest email sent for ${slug}`);
    } catch (err) {
        console.error('📧 Email send failed:', err.message);
    }
}

// ══════════════════════════════════════════════════════════════
// REIMAGINE FEATURE: Admin Auth
// ══════════════════════════════════════════════════════════════

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, { user: username, createdAt: Date.now() });
        return res.json({ success: true, token });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(token);
    res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
// REIMAGINE FEATURE: Admin Client CRUD
// ══════════════════════════════════════════════════════════════

// List all clients
app.get('/api/admin/clients', requireAuth, (req, res) => {
    const clients = readJSON(CLIENTS_FILE);
    // Don't send the full HTML in list response (too large)
    const summary = clients.map(c => ({
        slug: c.slug,
        clientName: c.clientName,
        oldUrl: c.oldUrl,
        contactEmail: c.contactEmail,
        active: c.active,
        createdAt: c.createdAt,
        assetCount: c.assets ? c.assets.length : 0
    }));
    res.json(summary);
});

// Get single client (with full HTML)
app.get('/api/admin/clients/:slug', requireAuth, (req, res) => {
    const clients = readJSON(CLIENTS_FILE);
    const client = clients.find(c => c.slug === req.params.slug);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
});

// Create new client
app.post('/api/admin/clients', requireAuth, upload.array('assets', 20), (req, res) => {
    const { clientName, oldUrl, contactEmail, reimaginedHtml } = req.body;

    if (!clientName || !reimaginedHtml) {
        return res.status(400).json({ error: 'Client name and reimagined HTML are required.' });
    }

    const slug = generateSlug(clientName);
    const clients = readJSON(CLIENTS_FILE);

    if (clients.find(c => c.slug === slug)) {
        return res.status(409).json({ error: 'A client with this slug already exists.' });
    }

    // Save uploaded assets
    const assetDir = path.join(REIMAGINED_DIR, slug);
    fs.mkdirSync(assetDir, { recursive: true });
    const assets = [];

    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            fs.writeFileSync(path.join(assetDir, safeName), file.buffer);
            assets.push({
                filename: safeName,
                url: `/reimagine-assets/${slug}/${safeName}`,
                size: file.size,
                mimetype: file.mimetype
            });
        });
    }

    const newClient = {
        slug,
        clientName,
        oldUrl: oldUrl || '',
        contactEmail: contactEmail || '',
        reimaginedHtml,
        assets,
        active: true,
        createdAt: new Date().toISOString()
    };

    clients.push(newClient);
    writeJSON(CLIENTS_FILE, clients);

    res.status(201).json({ success: true, slug, assets });
});

// Update client
app.put('/api/admin/clients/:slug', requireAuth, upload.array('assets', 20), (req, res) => {
    const clients = readJSON(CLIENTS_FILE);
    const idx = clients.findIndex(c => c.slug === req.params.slug);
    if (idx === -1) return res.status(404).json({ error: 'Client not found' });

    const { clientName, oldUrl, contactEmail, reimaginedHtml, active } = req.body;
    const client = clients[idx];

    if (clientName) client.clientName = clientName;
    if (oldUrl !== undefined) client.oldUrl = oldUrl;
    if (contactEmail !== undefined) client.contactEmail = contactEmail;
    if (reimaginedHtml) client.reimaginedHtml = reimaginedHtml;
    if (active !== undefined) client.active = active === 'true' || active === true;

    // Save any new uploaded assets
    if (req.files && req.files.length > 0) {
        const assetDir = path.join(REIMAGINED_DIR, client.slug);
        fs.mkdirSync(assetDir, { recursive: true });
        if (!client.assets) client.assets = [];

        req.files.forEach(file => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            fs.writeFileSync(path.join(assetDir, safeName), file.buffer);
            // Remove old entry if same filename
            client.assets = client.assets.filter(a => a.filename !== safeName);
            client.assets.push({
                filename: safeName,
                url: `/reimagine-assets/${client.slug}/${safeName}`,
                size: file.size,
                mimetype: file.mimetype
            });
        });
    }

    client.updatedAt = new Date().toISOString();
    clients[idx] = client;
    writeJSON(CLIENTS_FILE, clients);

    res.json({ success: true, slug: client.slug, assets: client.assets });
});

// Delete a single asset
app.delete('/api/admin/clients/:slug/assets/:filename', requireAuth, (req, res) => {
    const clients = readJSON(CLIENTS_FILE);
    const idx = clients.findIndex(c => c.slug === req.params.slug);
    if (idx === -1) return res.status(404).json({ error: 'Client not found' });

    const client = clients[idx];
    const assetPath = path.join(REIMAGINED_DIR, client.slug, req.params.filename);

    try {
        if (fs.existsSync(assetPath)) fs.unlinkSync(assetPath);
    } catch (e) { /* ignore */ }

    client.assets = (client.assets || []).filter(a => a.filename !== req.params.filename);
    clients[idx] = client;
    writeJSON(CLIENTS_FILE, clients);

    res.json({ success: true });
});

// Delete client
app.delete('/api/admin/clients/:slug', requireAuth, (req, res) => {
    let clients = readJSON(CLIENTS_FILE);
    const idx = clients.findIndex(c => c.slug === req.params.slug);
    if (idx === -1) return res.status(404).json({ error: 'Client not found' });

    const slug = clients[idx].slug;

    // Remove asset directory
    const assetDir = path.join(REIMAGINED_DIR, slug);
    try {
        if (fs.existsSync(assetDir)) {
            fs.rmSync(assetDir, { recursive: true, force: true });
        }
    } catch (e) { /* ignore */ }

    clients.splice(idx, 1);
    writeJSON(CLIENTS_FILE, clients);

    res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
// REIMAGINE FEATURE: Admin Replies
// ══════════════════════════════════════════════════════════════

app.get('/api/admin/replies', requireAuth, (req, res) => {
    const replies = readJSON(REPLIES_FILE);
    res.json(replies);
});

// ══════════════════════════════════════════════════════════════
// REIMAGINE FEATURE: Client-Facing Routes
// ══════════════════════════════════════════════════════════════

// Serve the reimagine showcase page
app.get('/reimagine/:slug', (req, res) => {
    const clients = readJSON(CLIENTS_FILE);
    const client = clients.find(c => c.slug === req.params.slug && c.active);
    if (!client) {
        return res.status(404).send(`
            <!DOCTYPE html><html><head><title>Not Found</title>
            <style>body{background:#0C0C0E;color:#F4F4F5;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
            .c{text-align:center}.c h1{font-family:'Syne',sans-serif;font-size:48px;margin-bottom:16px}.c p{color:#6B7280;font-size:14px}</style></head>
            <body><div class="c"><h1>404</h1><p>This reimagine showcase was not found.</p></div></body></html>
        `);
    }
    res.sendFile(path.join(__dirname, 'public', 'reimagine.html'));
});

// Get client data for the reimagine page (public — no auth)
app.get('/api/reimagine/:slug', (req, res) => {
    const clients = readJSON(CLIENTS_FILE);
    const client = clients.find(c => c.slug === req.params.slug && c.active);
    if (!client) return res.status(404).json({ error: 'Not found' });

    // Only send what the client page needs (not internal fields)
    res.json({
        slug: client.slug,
        clientName: client.clientName,
        oldUrl: client.oldUrl,
        reimaginedHtml: client.reimaginedHtml
    });
});

// Submit interest reply
app.post('/api/reimagine/:slug/reply', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const clients = readJSON(CLIENTS_FILE);
    const client = clients.find(c => c.slug === req.params.slug);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const reply = {
        slug: req.params.slug,
        clientName: client.clientName,
        name,
        phone,
        timestamp: new Date().toISOString()
    };

    const replies = readJSON(REPLIES_FILE);
    replies.push(reply);
    writeJSON(REPLIES_FILE, replies);

    // Send notification email (async, don't block response)
    sendNotificationEmail(client.clientName, req.params.slug, reply);

    res.json({ success: true, message: 'Thank you! We will contact you soon.' });
});



// ══════════════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});