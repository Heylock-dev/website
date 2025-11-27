import { fetchSessionMetadata, findSimilarSessions } from '@/scripts/supabase/fetcher';
import { vectorizeSession } from '@/scripts/ai/vectorize';

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionUUID, teamId, limit = 10, mode = 'eventhash' } = body;

    // Reject direct vector submission to ensure vectors are never provided by callers
    if (body?.vector) {
      return new Response(JSON.stringify({ error: { message: 'Direct vector submission is not allowed. Use sessionUUID only.' } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!sessionUUID) {
      return new Response(JSON.stringify({ error: { message: 'Missing `sessionUUID`' } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!teamId) {
      return new Response(JSON.stringify({ error: { message: 'teamId is required' } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let searchVector = null;
    // Fetch session metadata to see if a vector already exists
    const metadata = await fetchSessionMetadata(Number(teamId), sessionUUID);
    if (mode === 'vector') {
      if (metadata && metadata.vector && Array.isArray(metadata.vector)) {
        searchVector = metadata.vector;
      } else {
        // attempt to compute/stitch a new vector for this session
        try {
          const { vector: newVector } = await vectorizeSession(sessionUUID, Number(teamId));
          if (newVector) searchVector = newVector;
        } catch (err) {
          console.error('/api/similarity: unable to vectorize missing session vector', err);
          return new Response(JSON.stringify({ error: { message: 'Unable to compute vector for session' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
    } else {
      // eventhash mode: compute hashed event vector server-side using the computeHashedEventVector via fetcher
      try {
        const { fetchSessionEvents } = await import('@/scripts/supabase/fetcher');
        const { computeHashedEventVector } = await import('@/scripts/ai/vector_utils');
        const events = await fetchSessionEvents(sessionUUID);
        if (!events || events.length === 0) {
          return new Response(JSON.stringify({ error: { message: 'No events available for session' } }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        const v = computeHashedEventVector(events || [], 64);
        searchVector = v;
      } catch (err) {
        console.error('/api/similarity: unable to compute eventhash vector', err);
        return new Response(JSON.stringify({ error: { message: 'Unable to compute eventhash vector' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // if mode is eventhash but vector provided is different length, remap to hashed dimension
    const HASH_DIM = 64;
    if (mode === 'eventhash' && Array.isArray(searchVector) && searchVector.length !== HASH_DIM) {
      const remap = (vec, dim) => {
        const out = new Array(dim).fill(0);
        for (let i = 0; i < vec.length; i++) {
          out[i % dim] += Number(vec[i] || 0);
        }
        const norm = Math.sqrt(out.reduce((s, x) => s + x * x, 0));
        return norm === 0 ? out : out.map(x => x / norm);
      };
      searchVector = remap(searchVector, HASH_DIM);
    }

    const results = await findSimilarSessions(searchVector, { teamId: teamId ? Number(teamId) : null, limit, excludeSessionUUID: sessionUUID, mode });

    return new Response(JSON.stringify({ success: true, results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('/api/similarity error', error);
    return new Response(JSON.stringify({ error: { message: error?.message || 'Unknown error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
