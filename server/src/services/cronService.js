const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { generateReceipt } = require('./pdfService');
const { sendReceiptEmail } = require('./emailService');

const DB_PATH = path.join(__dirname, '../db/db.json');
const getDb = () => {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH));
    } catch (e) {
        return { receipts: [], settings: {} };
    }
};

const saveDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

const setupCron = () => {
    // Schedule for 8th of every month at 10:00 AM
    // "0 10 8 * *" -> At 10:00 on day-of-month 8
    // For MVP testing, we can log this.

    cron.schedule('0 10 8 * *', async () => {
        console.log('⏰ Running Monthly Receipt Automation...');

        const db = getDb();

        // Check for Skip Flag
        if (db.automationStatus && db.automationStatus.skipNext) {
            console.log('⏸️ Automation skipped for this month as requested.');
            // Reset the flag for next month? Or keep it?
            // Usually "skip next" implies just once.
            db.automationStatus.skipNext = false;
            saveDb(db);
            return;
        }

        if (!db.settings || !db.settings.email) {
            console.log('❌ No settings/email found. Skipping automation.');
            return;
        }

        const { tenantName, email, address, amount } = db.settings;

        // Calculate period (Current Month)
        // E.g. if running in Jan, it's for Jan? Or previous month? 
        // Usually you send receipt AFTER payment. Let's assume current month for now "Janvier 2026".
        const date = new Date();
        const period = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        try {
            // Generate
            const pdfBuffer = await generateReceipt({ tenantName, address, amount, period });

            // Send
            const emailResult = await sendReceiptEmail(email, { tenantName, period }, pdfBuffer);

            // Log
            const newReceipt = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                tenantName,
                period,
                amount,
                status: emailResult.success ? 'Sent (Auto)' : 'Failed (Auto)',
                emailId: emailResult.id
            };

            if (!db.receipts) db.receipts = [];
            db.receipts.unshift(newReceipt);
            saveDb(db);

            console.log(`✅ Automated receipt sent to ${email} for ${period}`);

        } catch (error) {
            console.error('❌ Automation Failed:', error);
        }
    });

    console.log('✅ Cron job scheduled: Runs 8th of every month at 10:00 AM');
};

module.exports = setupCron;
