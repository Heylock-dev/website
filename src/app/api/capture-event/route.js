import { matchApiKey } from '@/scripts/api/keyHandler';
import { storeEvent, updatePulse } from '@/scripts/supabase/warehouseInbound';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function POST(request) {
    const { sessionUUID, type, payload, uri } = await request.json();

    if (z.safeParse(z.uuid(), sessionUUID).success === false || z.safeParse(z.string().nonempty(), type).success === false) {
        return NextResponse.json({}, { status: 400 });
    }
    
    if (payload && z.safeParse(z.string().max(500), payload).success === false) {
        return NextResponse.json({}, { status: 400 });
    }
    
    if (uri && z.safeParse(z.string().max(500), uri).success === false) {
        return NextResponse.json({}, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const apiKey = authorization.split(' ')[1];
    const teamId = await matchApiKey(apiKey);
    
    if (z.safeParse(z.number(), teamId).success === false) {
        return NextResponse.json({}, { status: 401 });
    }

    updatePulse(sessionUUID);

    await storeEvent(teamId, sessionUUID, type, payload&&payload, uri);

    return NextResponse.json({}, { status: 200 });
}