import { matchApiKey } from '@/scripts/api/keyHandler';
import { appendReplayEvents, compressReplayEvents, updatePulse } from '@/scripts/supabase/warehouseInbound';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function POST(request) {
    const data = await request.json();

    const inputSchema = z.object({
        sessionUUID: z.uuid(),
        replayEvents: z.array(z.object()),
        hasBeenRecordingReplay: z.boolean().optional(),
        apiKey: z.string().optional()
    });
    
    if(z.safeParse(inputSchema, data).success === false) {
        return NextResponse.json({}, { status: 400 });
    }

    const { sessionUUID, replayEvents, hasBeenRecordingReplay = true, apiKey: bodyApiKey } = data;

    const authorization = request.headers.get('authorization');
    const apiKey = authorization ? authorization.split(' ')[1] : bodyApiKey;
    const teamId = await matchApiKey(apiKey);
    
    if (z.safeParse(z.number(), teamId).success === false) {
        return NextResponse.error({}, { status: 401 });
    }

    updatePulse(sessionUUID);

    // VULNERABILITY: Check if this session belongs to this team

    if (hasBeenRecordingReplay === true && replayEvents.length !== 0) {
        await appendReplayEvents(teamId, sessionUUID, replayEvents);
    }

    if(hasBeenRecordingReplay === true) {
        compressReplayEvents(teamId, sessionUUID);
    }

    return NextResponse.json({}, { status: 200 });
}