import { vectorizeSession } from '@/scripts/ai/vectorize';

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, sessionUUID, teamId } = body;

    // For privacy: do not accept raw vectors from clients/AI. Enforce server-side vector computation.
    if (body?.vector) {
      return new Response(JSON.stringify({ error: { message: 'Direct vector submission is not allowed. Use sessionUUID or text only.' } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Use vectorizeSession helper to process session events or free text and store vectors if possible.
    if (!sessionUUID && !text) {
      return new Response(
        JSON.stringify({ error: { message: 'Missing `text` or `sessionUUID` in request body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    try {
      const { result: vectorResult } = await vectorizeSession(sessionUUID || null, teamId, { textOverride: text });
      return new Response(JSON.stringify({ success: true, sessionUUID: sessionUUID || null, vectorStored: Boolean(vectorResult?._vectorStored) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: err?.message || 'Failed to vectorize session/text' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // All handled above by vectorizeSession; nothing left to do here.
  } catch (error) {
    console.error('Server /api/vectorize error', error);

    const message = error?.message || 'Unknown error';
    const name = error?.name || 'Error';
    const statusCode = error?.statusCode || 500;

    return new Response(JSON.stringify({ error: { message, name, statusCode } }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
