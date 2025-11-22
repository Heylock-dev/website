"use server";

import crypto from 'crypto';
import { storeOrReplaceApiKey } from '../supabase/warehouseInbound';
import { fetchTeamIdByKeyHash } from '../supabase/fetcher';
import z from 'zod';

// Generate a new API key, encrypt it, and hash it
export async function generateAndStoreApiKey(teamId) {
    const encryptionKey = process.env.API_ENCRYPTION_KEY; // Must be 32 bytes for AES-256
    const hmacSecret = process.env.API_HMAC_SERCRET;

    if (!encryptionKey || !hmacSecret) {
        throw new Error('Environment variables are not loaded correctly');
    }

    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Encrypt the API Key
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(encryptionKey, 'hex'), iv);
    const encryptedApiKey = Buffer.concat([cipher.update(apiKey), cipher.final()]).toString('hex');
    
    // Create HMAC hash for lookup
    const apiKeyHash = crypto.createHmac('sha256', hmacSecret).update(apiKey).digest('hex');
    
    // Store teamId, encryptedApiKey, iv, apiKeyHash in DB
    await storeOrReplaceApiKey(teamId, apiKeyHash, encryptedApiKey, iv.toString('hex'));

    console.log('keyHandler.js:29 API KEY:', apiKey);

    return apiKey;
}

// Match incoming API key to user DB record
export async function matchApiKey(providedApiKey) {
    if(z.parse(z.string(), providedApiKey) === false) {
        return null;
    }

    const hmacSecret = process.env.API_HMAC_SERCRET;
    if (!hmacSecret) {
        throw new Error('Environment variables are not loaded correctly');
    }

    const apiKeyHash = crypto.createHmac('sha256', hmacSecret).update(providedApiKey).digest('hex');
    
    const teamId = await fetchTeamIdByKeyHash(apiKeyHash);

    return teamId;
}
