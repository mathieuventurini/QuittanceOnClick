import { getSettings, getDb } from '../utils/db.js';

export default async function handler(req, res) {
    const check = (name) => process.env[name] ? '✅ Set' : '❌ MISSING';

    // Get actual settings used by Cron
    let dbStatus = "Unknown";
    let activeSettings = null;

    try {
        const db = await getDb();
        dbStatus = db.automationStatus || "Missing automationStatus";
    } catch (e) {
        dbStatus = `Error: ${e.message}`;
    }

    try {
        activeSettings = getSettings();
    } catch (e) {
        activeSettings = `Error: ${e.message}`;
    }

    const report = {
        _NOTE: "Do not share valid keys screenshots publicly. Only report MISSING ones.",
        ENV_VARS: {
            RESEND_API_KEY: check('RESEND_API_KEY'),
            TENANT_EMAIL: check('TENANT_EMAIL'),
            TENANT_NAME: check('TENANT_NAME'),
            PROPERTY_ADDRESS: check('PROPERTY_ADDRESS'),
            RENT_AMOUNT: check('RENT_AMOUNT'),
            KV_REST_API_URL: check('KV_REST_API_URL'),
            KV_REST_API_TOKEN: check('KV_REST_API_TOKEN'),
            OWNER_NAME: check('OWNER_NAME')
        },
        RUNTIME_SETTINGS: activeSettings,
        DB_STATUS: dbStatus,
        TIMESTAMP: new Date().toISOString()
    };

    res.status(200).json(report);
}
