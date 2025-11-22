import { matchApiKey } from '@/scripts/api/keyHandler';
import { appendReplayEvents, updatePulse } from '@/scripts/supabase/warehouseInbound';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function POST(request) {
    const data = await request.json();

    const inputSchema = z.object({
        sessionUUID: z.uuid(),
        events: z.array(z.object())
    });
    
    if(z.safeParse(inputSchema, data).success === false) {
        return NextResponse.json({}, { status: 400 });
    }

    const { sessionUUID, events } = data;
    
    const authorization = request.headers.get('authorization');
    const apiKey = authorization.split(' ')[1];
    const teamId = await matchApiKey(apiKey);
    
    if (z.safeParse(z.number(), teamId).success === false) {
        return NextResponse.error({}, { status: 401 });
    }

    updatePulse(sessionUUID);

    // VULNERABILITY: Check if this session belongs to this team

    await appendReplayEvents(teamId, sessionUUID, events);

    return NextResponse.json({}, { status: 200 });
}