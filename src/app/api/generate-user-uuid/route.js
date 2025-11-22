import { matchApiKey } from '@/scripts/api/keyHandler';
import { generateAndStoreUserUUID } from '@/scripts/supabase/warehouseInbound';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function GET(request) {
    const authorization = request.headers.get('authorization');
    const apiKey = authorization.split(' ')[1];
    const teamId = await matchApiKey(apiKey);
    
    if (z.parse(z.number(), teamId) === false) {
        return NextResponse.json({}, { status: 401 })
    }

    const uuid = await generateAndStoreUserUUID(teamId);

    return NextResponse.json({ uuid });
}