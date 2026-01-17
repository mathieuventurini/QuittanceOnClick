import { Resend } from 'resend';
import { getDb, saveDb, getSettings, kv } from '../utils/db.js';
import { generateReceiptBuffer } from '../utils/pdf.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
    console.log('🔔 Cron Job Initiated: /api/cron/send-receipt');
    console.log('HEADERS:', JSON.stringify(request.headers, null, 2));

    try {
        const db = await getDb();
        const settings = getSettings();

        // 0. Atomic Lock (Prevent Double-Execution)
        // Only works if Vercel KV is configured
        if (kv) {
            // Reverted to Full Date (Daily) for testing
            const periodKey = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const lockKey = `lock:cron:${periodKey.replace(/\s/g, '_')}`;
            try {
                // Try to acquire lock for 5 minutes
                const acquired = await kv.set(lockKey, 'locked', { nx: true, ex: 300 });
                if (!acquired) {
                    console.log('🔒 Lock exists. Another function is processing this period.');
                    return response.status(200).json({ status: 'Locked', message: 'Concurrent execution detected.' });
                }
            } catch (e) {
                console.warn('⚠️ KV Locking failed, proceeding without lock:', e);
            }
        }

        // 1. Check if automation is skipped
        if (db.automationStatus && db.automationStatus.skipNext) {
            db.automationStatus.skipNext = false; // Reset for next month
            await saveDb(db);
            console.log('⏭️ Automation skipped by user request.');
            return response.status(200).json({ status: 'Skipped', message: 'Automation was skipped by user.' });
        }

        // ...

        // 3. Check for duplicates (Anti-Double-Send)
        // Reverted: Use Day + Month + Year (Daily receipt)
        const period = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const capitalizedPeriod = period.charAt(0).toUpperCase() + period.slice(1);

        // Safety check for existing receipts array
        const receipts = db.receipts || [];

        const alreadySent = receipts.find(r =>
            r.period === capitalizedPeriod &&
            r.status.includes('Sent')
        );

        if (alreadySent) {
            console.log(`⏭️ Receipt for ${capitalizedPeriod} already sent. Skipping.`);
            return response.status(200).json({ status: 'Skipped', message: 'Receipt already sent for this period.' });
        }

        // 4. Generate PDF
        const pdfBuffer = await generateReceiptBuffer({
            ...settings,
            date: new Date().toLocaleDateString('fr-FR'),
            period: capitalizedPeriod
        });

        // 5. Send Email
        const { data: emailData, error } = await resend.emails.send({
            from: 'Quittance Express <onboarding@resend.dev>', // Should use verified domain
            to: [settings.email],
            subject: `Quittance de loyer - ${capitalizedPeriod}`,
            html: `
        <p>Bonjour ${settings.tenantName},</p>
        <p>Veuillez trouver ci-joint votre quittance de loyer pour la période <strong>${capitalizedPeriod}</strong>.</p>
        <p>Cordialement,</p>
      `,
            attachments: [{
                filename: `quittance-${capitalizedPeriod.replace(/\s/g, '_')}.pdf`,
                content: pdfBuffer,
            }],
        });

        if (error) throw error;

        // 6. Update History
        const newReceipt = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            tenantName: settings.tenantName,
            period: capitalizedPeriod,
            amount: settings.amount,
            status: 'Sent (Auto)',
            emailId: emailData.id
        };

        if (!db.receipts) db.receipts = [];
        db.receipts.unshift(newReceipt);
        await saveDb(db);

        return response.status(200).json({
            success: true,
            message: 'Cron executed successfully',
            receipt: newReceipt,
            debug: { settingsLoaded: true, emailSentTo: settings.email }
        });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error.message });
    }
}
