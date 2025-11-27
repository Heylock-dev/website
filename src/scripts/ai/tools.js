import Firecrawl from "@mendable/firecrawl-js";
import { fetchTeamSessionsMetadata, fetchSessionEvents, fetchSessionMetadata, findSimilarSessions } from '@/scripts/supabase/fetcher';
import { vectorizeSession } from '@/scripts/ai/vectorize';
import { computeHashedEventVector } from '@/scripts/ai/vector_utils';

export async function scrape({ url }) {
    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

    const response = await firecrawl.scrape(url, {
        formats: ['markdown'],
        actions: [
            { type: 'wait', milliseconds: 1500 }
        ]
    });

    console.log(response);
    
    return response;
}

export async function search({ searchTerm }) {
    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

    const response = await firecrawl.search(searchTerm, {
        scrapeOptions: {
            formats: ['markdown'],
        },
        limit: 5
    });

    console.log(response);
    
    return response;
}

export async function map({ url }) {
    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

    const response = await firecrawl.map(url, {
        limit: 40
    });

    console.log(response);
    
    return response;
}

export async function crawl({ url }) {
    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

    const response = await firecrawl.crawl(url, {
        limit: 5
    });

    console.log(response);
    
    return response;
}

export async function listSessions({ teamId, from = 0, count = 20 }) {
    if (!teamId) {
        throw new Error('teamId is required');
    }

    // Ensure numbers
    const fromNumber = Number(from) || 0;
    const countNumber = Number(count) || 20;

    try {
        const result = await fetchTeamSessionsMetadata(Number(teamId), fromNumber, countNumber);

        // Standardize the return shape for the tool
        return {
            data: result?.data || [],
            totalCount: result?.totalCount || 0,
        };
    } catch (error) {
        console.error('Error fetching sessions for team:', error);
        throw error;
    }
}

export async function listSessionEvents({ sessionUUID, teamId }) {
    if (!sessionUUID) {
        throw new Error('sessionUUID is required');
    }

    console.log(sessionUUID, teamId);
    
    try {
        if (teamId) {
            // Validate session belongs to the team
            const metadata = await fetchSessionMetadata(Number(teamId), sessionUUID);
            
            if (!metadata) {
                throw new Error('Session not found for team');
            }
        }

        const events = await fetchSessionEvents(sessionUUID);
        return { events: events || [] };
    } catch (error) {
        console.error('Error fetching session events:', error);
        throw error;
    }
}

export async function findSimilarSessionsTool({ sessionUUID, teamId, limit = 10, mode = 'eventhash' }) {
    // Accept only a sessionUUID. Tools or callers should not provide raw vectors.
    let searchVector = null;
    try {
        const HASH_DIM = 64;
        function remapVectorToDim(vec, dim) {
            const out = new Array(dim).fill(0);
            for (let i = 0; i < vec.length; i++) {
                out[i % dim] += Number(vec[i] || 0);
            }
            const norm = Math.sqrt(out.reduce((s, x) => s + x * x, 0));
            return norm === 0 ? out : out.map(x => x / norm);
        }

        if (!sessionUUID) {
            throw new Error('sessionUUID is required for findSimilarSessionsTool');
        }

        const metadata = await fetchSessionMetadata(Number(teamId), sessionUUID);
        // If mode is 'vector', prefer the stored vector, otherwise fallback to vectorizeSession
        if (mode === 'vector') {
            if (metadata && metadata.vector && Array.isArray(metadata.vector)) {
                searchVector = metadata.vector;
            } else {
                // compute a new vector via the server-side vectorizeSession helper
                const { vector: newVector } = await vectorizeSession(sessionUUID, Number(teamId));
                if (newVector && Array.isArray(newVector)) searchVector = newVector;
            }
        } else {
            // eventhash mode: compute hashed event vector from the events
            const events = await fetchSessionEvents(sessionUUID);
            if (!events || events.length === 0) throw new Error('No events to construct vector');
            searchVector = computeHashedEventVector(events, 64);
        }

        if (mode === 'eventhash' && Array.isArray(searchVector) && searchVector.length !== HASH_DIM) {
            searchVector = remapVectorToDim(searchVector, HASH_DIM);
        }

        if (!searchVector) {
            throw new Error('Unable to compute a search vector for the provided sessionUUID');
        }

        const results = await findSimilarSessions(searchVector, { teamId, limit, excludeSessionUUID: sessionUUID, mode });
        return { results };
    } catch (error) {
        console.error('Error in findSimilarSessionsTool', error);
        throw error;
    }
}

