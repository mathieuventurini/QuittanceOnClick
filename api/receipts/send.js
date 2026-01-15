import { Resend } from 'resend';
import { getDb, saveDb } from '../utils/db.js';
import { generateReceiptBuffer } from '../utils/pdf.js';



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, tenantName, address, amount, period } = req.body;

        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is missing in environment variables');
        }
        const resend = new Resend(process.env.RESEND_API_KEY);

        // 1. Generate PDF
        const pdfBuffer = await generateReceiptBuffer({
            date: new Date().toLocaleDateString('fr-FR'),
            period,
            tenantName,
            address,
            amount
        });

        // 2. Send Email
        const { data: emailData, error } = await resend.emails.send({
            from: 'Quittance Express <onboarding@resend.dev>', // Update if domain verified
            to: [email],
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

        if (error) throw error;

        // 3. Update History
        const db = await getDb();
        const newReceipt = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            tenantName,
            period,
            amount,
            status: 'Sent',
            emailId: emailData.id
        };

        if (!db.receipts) db.receipts = [];
        db.receipts.unshift(newReceipt);
        await saveDb(db);

        res.status(200).json({ success: true, receipt: newReceipt });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
