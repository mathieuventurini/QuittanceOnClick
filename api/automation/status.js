import { getDb, saveDb } from '../utils/db.js';

export default async function handler(req, res) {
    try {
        const db = await getDb();

        if (req.method === 'GET') {
            return res.status(200).json(db.automationStatus || { skipNext: false });
        }

        if (req.method === 'POST') {
            const { skipNext } = req.body;
            db.automationStatus = { skipNext };
            await saveDb(db);
            return res.status(200).json(db.automationStatus);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
