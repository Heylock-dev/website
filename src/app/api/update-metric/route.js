import { matchApiKey } from '@/scripts/api/keyHandler';
import { storeEvent, updateMetric, updatePulse } from '@/scripts/supabase/warehouseInbound';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function POST(request) {
    const data = await request.json();
    
    const { name, delta, value, sessionUUID, reason, uri } = data;

    const inputSchema = z.object({
        name: z.string(),
        delta: z.number().optional(),
        value: z.number().optional(),
        sessionUUID: z.uuid().optional().nullable(),
        reason: z.string().max(500).optional().nullable(),
        uri: z.string().max(500).optional().nullable()
    });

    if (!Boolean(delta) && !Boolean(value)) {
        return NextResponse.json({}, { status: 400 });
    }
    
    if (z.parse(inputSchema, data) === false) {
        return NextResponse.json({}, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const apiKey = authorization.split(' ')[1];
    const teamId = await matchApiKey(apiKey);
    
    if (z.safeParse(z.number(), teamId).success === false) {
        return NextResponse.json({}, { status: 401 });
    }

    updatePulse(sessionUUID);

    const { success, code } = await updateMetric(teamId, name, { delta, value });

    if (success === false) {
        if (code === 'NOT_FOUND'){
            return NextResponse.json({}, { status: 404, statusText: 'METRIC_NOT_FOUND' });
        } else {
            return NextResponse.json({}, { status: 500 });
        }
    }

    if (z.safeParse(z.uuid(), sessionUUID).success === true) {
        storeEvent(teamId, sessionUUID, `Metric-${name}`, { delta, value, reason }, uri);
    }

    return NextResponse.json({}, { status: 200 });
}