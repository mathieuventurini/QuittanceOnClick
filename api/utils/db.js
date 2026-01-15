import { kv } from '@vercel/kv';

// Default data structure
const DEFAULT_DB = {
    receipts: [],
    automationStatus: { skipNext: false }
};

export const getDb = async () => {
    // In Vercel KV, we'll store everything under a 'db' key or separate keys.
    // For simplicity and migration, let's treat 'db' as the big JSON object.
    const data = await kv.get('db');
    return data || DEFAULT_DB;
};

export const saveDb = async (data) => {
    await kv.set('db', data);
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
