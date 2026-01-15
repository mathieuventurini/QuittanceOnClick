const express = require('express');
const router = express.Router();
const { generateReceipt } = require('../services/pdfService');
const { sendReceiptEmail } = require('../services/emailService');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db/db.json');

// Helper to read/write DB
const getDb = () => JSON.parse(fs.readFileSync(DB_PATH));
const saveDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// GET /api/history
router.get('/history', (req, res) => {
    try {
        const db = getDb();
        res.json(db.receipts || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read history' });
    }
});

// POST /api/receipts/preview
router.post('/receipts/preview', async (req, res) => {
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
router.post('/receipts/send', async (req, res) => {
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
router.get('/settings', (req, res) => {
    try {
        const db = getDb();
        res.json(db.settings || {});
    } catch (err) {
        res.json({});
    }
});

// GET /api/automation/status
router.get('/automation/status', (req, res) => {
    try {
        const db = getDb();
        res.json(db.automationStatus || { skipNext: false });
    } catch (err) {
        res.json({ skipNext: false });
    }
});

// POST /api/automation/status
router.post('/automation/status', (req, res) => {
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
