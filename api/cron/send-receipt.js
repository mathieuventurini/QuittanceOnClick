import { Resend } from 'resend';
import { getDb, saveDb, getSettings } from '../utils/db.js';
import { generateReceiptBuffer } from '../utils/pdf.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
    try {
        const db = await getDb();
        const settings = getSettings();

        // 1. Check if automation is skipped
        if (db.automationStatus && db.automationStatus.skipNext) {
            db.automationStatus.skipNext = false; // Reset for next month
            await saveDb(db);
            console.log('⏭️ Automation skipped by user request.');
            return response.status(200).json({ status: 'Skipped', message: 'Automation was skipped by user.' });
        }

        // 2. Validate Settings
        if (!settings.email || !settings.tenantName) {
            return response.status(500).json({
                error: 'Missing environment variables for tenant settings.',
                debug: {
                    email: settings.email ? 'Set' : 'Missing',
                    tenantName: settings.tenantName ? 'Set' : 'Missing'
                }
            });
        }

        // 3. Check for duplicates (Anti-Double-Send)
        const period = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const capitalizedPeriod = period.charAt(0).toUpperCase() + period.slice(1);

        // Safety check for existing receipts array
        const receipts = db.receipts || [];

        const alreadySent = receipts.find(r =>
            r.period === capitalizedPeriod &&
            r.status.includes('Sent')
        );

        // TEMPORARY: Disabled for testing loop
        // if (alreadySent) {
        //     console.log(`⏭️ Receipt for ${capitalizedPeriod} already sent. Skipping.`);
        //     return response.status(200).json({ status: 'Skipped', message: 'Receipt already sent for this period.' });
        // }

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
