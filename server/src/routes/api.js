const express = require('express');
const router = express.Router();
const { generateReceipt } = require('../services/pdfService');
const { sendReceiptEmail } = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const PASSWORD = process.env.ADMIN_PASSWORD;

// Middleware Auth
const isAuthenticated = (req, res, next) => {
    // Check header or cookie
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

    if (!token) {
        // Check "cookie" header directly if cookie parser not used
        const cookies = cookie.parse(req.headers.cookie || '');
        if (!cookies.token) return res.status(401).json({ error: 'Unauthorized' });

        try {
            jwt.verify(cookies.token, SECRET);
            return next();
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    try {
        jwt.verify(token, SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const DB_PATH = path.join(__dirname, '../db/db.json');

// Helper to read/write DB
const getDb = () => JSON.parse(fs.readFileSync(DB_PATH));
const saveDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// POST /api/auth/login
router.post('/auth/login', (req, res) => {
    const { password } = req.body;
    console.log('Login attempt with:', password, 'Expected:', PASSWORD);

    if (password === PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '7d' });
        res.setHeader('Set-Cookie', cookie.serialize('token', token, {
            httpOnly: true,
            secure: false, // Local dev
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'strict',
            path: '/'
        }));
        return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid password' });
});

// GET /api/auth/me
router.get('/auth/me', (req, res) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    try {
        if (cookies.token) {
            jwt.verify(cookies.token, SECRET);
            return res.json({ authenticated: true });
        }
    } catch (e) { }
    res.json({ authenticated: false });
});

// GET /api/history
router.get('/history', isAuthenticated, (req, res) => {
    try {
        const db = getDb();
        res.json(db.receipts || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read history' });
    }
});

// POST /api/receipts/preview
router.post('/receipts/preview', isAuthenticated, async (req, res) => {
    try {
        const data = req.body; // { tenantName, address, amount, period }
        const pdfBuffer = await generateReceipt(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=preview.pdf');
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Preview Error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// POST /api/receipts/send
router.post('/receipts/send', isAuthenticated, async (req, res) => {
    try {
        const { tenantName, email, address, amount, period } = req.body;

        // 1. Generate PDF
        const pdfBuffer = await generateReceipt({ tenantName, address, amount, period });

        // 2. Send Email
        const emailResult = await sendReceiptEmail(email, { tenantName, period }, pdfBuffer);

        // 3. Save to History
        const db = getDb();
        const newReceipt = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            tenantName,
            period,
            amount,
            status: emailResult.success ? 'Sent' : 'Failed',
            emailId: emailResult.id
        };

        // Initialize receipts array if not exists
        if (!db.receipts) db.receipts = [];
        db.receipts.unshift(newReceipt); // Add to top

        // Also save as "last settings" to pre-fill future forms
        db.settings = { tenantName, email, address, amount };

        saveDb(db);

        res.json({ success: true, receipt: newReceipt });
    } catch (err) {
        console.error('Send Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/settings (for pre-filling form)
router.get('/settings', isAuthenticated, (req, res) => {
    try {
        const db = getDb();
        res.json(db.settings || {});
    } catch (err) {
        res.json({});
    }
});

// GET /api/automation/status
router.get('/automation/status', isAuthenticated, (req, res) => {
    try {
        const db = getDb();
        res.json(db.automationStatus || { skipNext: false });
    } catch (err) {
        res.json({ skipNext: false });
    }
});

// POST /api/automation/status
router.post('/automation/status', isAuthenticated, (req, res) => {
    try {
        const { skipNext } = req.body;
        const db = getDb();
        db.automationStatus = { skipNext };
        saveDb(db);
        res.json({ success: true, skipNext });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

module.exports = router;
