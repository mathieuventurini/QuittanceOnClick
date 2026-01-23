const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
} else {
    console.log('⚠️ EMAIL_USER or EMAIL_PASS missing. Email service will run in MOCK mode.');
}

/**
 * Sends the receipt email with PDF attachment
 * @param {string} to - Recipient email
 * @param {Object} data - Receipt data for subject/body
 * @param {Buffer} pdfBuffer - The PDF file
 */
const sendReceiptEmail = async (to, data, pdfBuffer) => {
    if (!transporter) {
        console.log('⚠️ Mocking email send (No Credentials).');
        console.log(`To: ${to}, Subject: Quittance ${data.period}`);
        return { success: true, id: 'mock-id-' + Date.now() };
    }

    try {
        console.log(`📧 Sending (via Gmail) to ${to}...`);
        const info = await transporter.sendMail({
            from: `"Quittance Express" <${process.env.EMAIL_USER}>`,
            to: to,
            bcc: ["mathieu.venturini@gmail.com", "anne.funfschilling@yahoo.com"],
            subject: `Quittance de loyer - ${data.period}`,
            html: `
        <p>Bonjour ${data.tenantName},</p>
        <p>Veuillez trouver ci-joint votre quittance de loyer pour la période <strong>${data.period}</strong>.</p>
        <p>Cordialement,<br>Mathieu Venturini</p>
      `,
            attachments: [
                {
                    filename: `quittance-${data.period.replace(/\s/g, '_')}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        console.log('✅ Email sent:', info.messageId);
        return { success: true, id: info.messageId };
    } catch (error) {
        console.error('❌ Email Send Failed:', error);
        throw error;
    }
};

module.exports = { sendReceiptEmail };
