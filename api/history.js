import { getDb } from './utils/db.js';
import { isAuthenticated } from './utils/auth.js';

export default async function handler(request, response) {
    if (!isAuthenticated(request)) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = await getDb();
        response.status(200).json(db.receipts || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
