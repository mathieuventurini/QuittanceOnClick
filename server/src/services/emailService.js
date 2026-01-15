const { Resend } = require('resend');
require('dotenv').config();

let resend;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
} else {
    console.log('⚠️ RESEND_API_KEY is missing. Email service will run in MOCK mode.');
}

/**
 * Sends the receipt email with PDF attachment
 * @param {string} to - Recipient email
 * @param {Object} data - Receipt data for subject/body
 * @param {Buffer} pdfBuffer - The PDF file
 */
const sendReceiptEmail = async (to, data, pdfBuffer) => {
    if (!resend) {
        console.log('⚠️ Mocking email send (No API Key).');
        console.log(`To: ${to}, Subject: Quittance ${data.period}`);
        return { success: true, id: 'mock-id-' + Date.now() };
    }

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: 'Quittance Express <onboarding@resend.dev>', // Update with your domain if verified
            to: [to],
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

        if (error) {
            console.error('Resend Error:', error);
            throw error;
        }

        return { success: true, id: emailData.id };
    } catch (error) {
        console.error('Email Send Failed:', error);
        throw error;
    }
};

module.exports = { sendReceiptEmail };
