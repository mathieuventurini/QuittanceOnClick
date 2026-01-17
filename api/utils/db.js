import { kv } from '@vercel/kv';
export { kv }; // Export kv for direct usage (e.g., locking)
import Redis from 'ioredis';

// Default data structure
const DEFAULT_DB = {
    receipts: [],
    automationStatus: { skipNext: false }
};

let redisClient = null;
const getRedisClient = () => {
    if (!redisClient && process.env.REDIS_URL) {
        redisClient = new Redis(process.env.REDIS_URL);
    }
    return redisClient;
};

export const getDb = async () => {
    // 1. Try Vercel KV (Rest API)
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
            const data = await kv.get('db');
            return data || DEFAULT_DB;
        } catch (error) {
            console.error('❌ Failed to connect to Vercel KV:', error);
        }
    }

    // 2. Try Standard Redis (ioredis) using REDIS_URL
    if (process.env.REDIS_URL) {
        try {
            const client = getRedisClient();
            const data = await client.get('db');
            // Redis stores strings, need to parse
            return data ? JSON.parse(data) : DEFAULT_DB;
        } catch (error) {
            console.error('❌ Failed to connect to Redis URL:', error);
        }
    }

    // 3. Fallback (No Persistence)
    console.warn('⚠️ No Database configured. Falling back to in-memory DB.');
    return DEFAULT_DB;
};

export const saveDb = async (data) => {
    // 1. Try Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
            await kv.set('db', data);
            return;
        } catch (error) {
            console.error('❌ Failed to save to Vercel KV:', error);
        }
    }

    // 2. Try Standard Redis
    if (process.env.REDIS_URL) {
        try {
            const client = getRedisClient();
            // Redis needs stringified JSON
            await client.set('db', JSON.stringify(data));
            return;
        } catch (error) {
            console.error('❌ Failed to save to Redis URL:', error);
        }
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
