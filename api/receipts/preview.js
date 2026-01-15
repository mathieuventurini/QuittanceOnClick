import { generateReceiptBuffer } from '../utils/pdf.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tenantName, address, amount, period } = req.body;

        const buffer = await generateReceiptBuffer({
            date: new Date().toLocaleDateString('fr-FR'),
            period,
            tenantName,
            address,
            amount
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
