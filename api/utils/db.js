import { kv } from '@vercel/kv';

// Default data structure
const DEFAULT_DB = {
    receipts: [],
    automationStatus: { skipNext: false }
};

export const getDb = async () => {
    // Safety check: Return default if KV is not configured (prevents crash)
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.warn('⚠️ Vercel KV is not configured. Falling back to default in-memory DB (data will be lost on restart).');
        return DEFAULT_DB;
    }

    try {
        const data = await kv.get('db');
        return data || DEFAULT_DB;
    } catch (error) {
        console.error('❌ Failed to connect to Vercel KV:', error);
        // Fallback to avoid 500 error, though persistence will fail
        return DEFAULT_DB;
    }
};

export const saveDb = async (data) => {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
    try {
        await kv.set('db', data);
    } catch (error) {
        console.error('❌ Failed to save to Vercel KV:', error);
    }
};

export const getSettings = () => {
    // Settings are now from Environment Variables
    return {
        tenantName: process.env.TENANT_NAME,
        email: process.env.TENANT_EMAIL,
        address: process.env.PROPERTY_ADDRESS,
        amount: process.env.RENT_AMOUNT
    };
};
