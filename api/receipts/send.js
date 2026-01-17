import nodemailer from 'nodemailer';
import { getDb, saveDb } from '../utils/db.js';
import { generateReceiptBuffer } from '../utils/pdf.js';
import { isAuthenticated } from '../utils/auth.js';

// Configure Nodemailer for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export default async function handler(request, response) {
    if (!isAuthenticated(request)) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, tenantName, address, amount, period } = request.body;

        // Validation
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Missing Gmail credentials');
            throw new Error('Server configured incorrectly: Missing email credentials');
        }

        // 1. Generate PDF
        const pdfBuffer = await generateReceiptBuffer({
            date: new Date().toLocaleDateString('fr-FR'),
            period,
            tenantName,
            address,
            amount
        });

        // 2. Send Email via Gmail SMTP
        console.log(`📧 Sending receipt for ${period} to ${email}...`);

        try {
            const info = await transporter.sendMail({
                from: `"Quittance Express" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Quittance de loyer - ${period}`,
                html: `
            <p>Bonjour ${tenantName},</p>
            <p>Veuillez trouver ci-joint votre quittance de loyer pour la période <strong>${period}</strong>.</p>
            <p>Cordialement,</p>
          `,
                attachments: [{
                    filename: `quittance-${period.replace(/\s/g, '_')}.pdf`,
                    content: pdfBuffer,
                }],
            });
            console.log('✅ Email sent:', info.messageId);

            // 3. Update History
            const db = await getDb();
            const newReceipt = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                tenantName,
                period,
                amount,
                status: 'Sent',
                emailId: info.messageId
            };

            if (!db.receipts) db.receipts = [];
            db.receipts.unshift(newReceipt);
            await saveDb(db);

            response.status(200).json({ success: true, receipt: newReceipt });

        } catch (emailError) {
            console.error('❌ Gmail Send Error:', emailError);
            throw emailError;
        }

    } catch (err) {
        console.error(err);
        response.status(500).json({ error: err.message });
    }
}
