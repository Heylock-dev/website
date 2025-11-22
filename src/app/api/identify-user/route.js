import { matchApiKey } from '@/scripts/api/keyHandler';
import { identifyAndStoreUserIdentifier } from '@/scripts/supabase/warehouseInbound';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function POST(request) {
    const data = await request.json();

    const inputSchema = z.object({
        userUUID: z.uuid(),
        identifier: z.string().min(1).max(500)
    });

    if (z.safeParse(inputSchema, data).success === false) {
        return NextResponse.json({}, { status: 400 });
    }

    const { userUUID, identifier } = data;

    const authorization = request.headers.get('authorization');
    const apiKey = authorization && authorization.split(' ')[1];
    const teamId = await matchApiKey(apiKey);

    if (z.safeParse(z.number(), teamId).success === false) {
        return NextResponse.json({}, { status: 401 });
    }

    try {
        const result = await identifyAndStoreUserIdentifier(teamId, userUUID, identifier);

        if (result && result.success === false) {
            return NextResponse.json({}, { status: 404 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({}, { status: 500 });
    }

    return NextResponse.json({}, { status: 200 });
}
