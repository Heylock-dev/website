import { matchApiKey } from '@/scripts/api/keyHandler';
import { generateAndStoreSessionUUID } from '@/scripts/supabase/warehouseInbound';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userUUID = searchParams.get('userUUID');
    const tagsParam = searchParams.get('tags');

    let tags;
    if (tagsParam) {
        try {
            tags = JSON.parse(tagsParam);
        } catch (error) {
            return NextResponse.json({}, { status: 400 });
        }

        const tagsSchema = z.array(z.string().min(1).max(500));
        if (z.safeParse(tagsSchema, tags).success === false) {
            return NextResponse.json({}, { status: 400 });
        }
    }

    if(z.safeParse(z.uuid(), userUUID).success === false) {
        return NextResponse.json({}, { status: 400 });
    }

    const authorization = request.headers.get('authorization');
    const apiKey = authorization.split(' ')[1];
    const teamId = await matchApiKey(apiKey);
    
    if (z.parse(z.number(), teamId) === false) {
        return NextResponse.json({}, { status: 401 });
    }

    const uuid = await generateAndStoreSessionUUID(teamId, userUUID, tags);

    return NextResponse.json({ uuid });
}