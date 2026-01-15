import { generateReceiptBuffer } from '../utils/pdf.js';

import { isAuthenticated } from '../utils/auth.js';

export default async function handler(request, response) {
    if (!isAuthenticated(request)) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tenantName, address, amount, period } = request.body;

        const buffer = await generateReceiptBuffer({
            date: new Date().toLocaleDateString('fr-FR'),
            period,
            tenantName,
            address,
            amount
        });

        response.setHeader('Content-Type', 'application/pdf');
        response.send(buffer);
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
}
