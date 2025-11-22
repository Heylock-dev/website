import { generateAndStoreApiKey, matchApiKey } from '@/scripts/api/keyHandler';
import { NextResponse } from 'next/server';
import z from 'zod';

export async function POST(request) {
    const { teamId } = request.json();

    if (teamId === null || z.parse(z.number(), teamId)) {
        return NextResponse.json({}, { status: 400 })
    }

    const apiKey = generateAndStoreApiKey(teamId);

    return NextResponse.json({ apiKey });
}