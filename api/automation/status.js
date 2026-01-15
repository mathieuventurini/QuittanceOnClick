import { getDb, saveDb } from '../utils/db.js';

import { isAuthenticated } from '../utils/auth.js';

export default async function handler(request, response) {
    if (!isAuthenticated(request)) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const db = await getDb();

        if (request.method === 'GET') {
            return response.status(200).json(db.automationStatus || { skipNext: false });
        }

        if (request.method === 'POST') {
            const { skipNext } = request.body;
            db.automationStatus = { skipNext };
            await saveDb(db);
            return response.status(200).json(db.automationStatus);
        }

        response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
}
