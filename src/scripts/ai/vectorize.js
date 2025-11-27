import { embed, embedMany, gateway } from 'ai';
import { fetchSessionEvents, fetchSessionReplay } from '@/scripts/supabase/fetcher';
import { storeSessionVector } from '@/scripts/supabase/warehouseInbound';
import { computeHashedEventVector } from './vector_utils';

// Helper to summarize payload as string
function summarizePayload(payload) {
  try {
    if (typeof payload === 'string') return payload;
    if (typeof payload === 'object') return JSON.stringify(payload);
    return String(payload);
  } catch (err) {
    return String(payload);
  }
}

function splitIntoChunks(text, maxLen) {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + maxLen, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > i) end = lastSpace;
    }
    chunks.push(text.slice(i, end));
    i = end + 1;
  }
  return chunks.filter(Boolean);
}

// use computeHashedEventVector from vector_utils

export async function vectorizeSession(sessionUUID, teamId, options = {}) {
  const { textOverride = null, maxEvents = 500, maxLength = 16000, chunkSize = 3000 } = options;

  if (!sessionUUID) throw new Error('sessionUUID is required');

  // If developer supplied textOverride, just embed that
  let textToEmbed = textOverride;

  if (!textToEmbed) {
    let events = await fetchSessionEvents(sessionUUID);
    if (!events || events.length === 0) {
      if (teamId != null) {
        const replayEvents = await fetchSessionReplay(Number(teamId), sessionUUID);
        if (Array.isArray(replayEvents) && replayEvents.length > 0) events = replayEvents;
      }
    }

    if (!events || events.length === 0) {
      throw new Error('Session events not found or failed to fetch');
    }

    const formatted = events.slice(0, maxEvents).map((ev) => {
      const ts = ev.created_at ? new Date(ev.created_at).toISOString() : 'unknown time';
      const uriPart = ev.uri ? ` ${ev.uri}` : '';
      const payload = ev.payload ? summarizePayload(ev.payload) : '';
      return `[${ts}] ${ev.type}${uriPart} - ${payload}`;
    }).join('\n');

    textToEmbed = formatted.length > maxLength ? formatted.slice(0, maxLength) + '\n...[truncated]' : formatted;
  }

  if (!textToEmbed) throw new Error('No text to embed');

  // Use embedMany if necessary
  let result;
  if (textToEmbed.length > chunkSize) {
    const chunks = splitIntoChunks(textToEmbed, chunkSize);
    const embedResult = await embedMany({
      model: gateway.textEmbeddingModel('openai/text-embedding-3-small'),
      values: chunks,
    });
    result = embedResult;
  } else {
    result = await embed({
      model: gateway.textEmbeddingModel('openai/text-embedding-3-small'),
      value: textToEmbed,
    });
  }

  // Compute a single vector from result: either single or averaged
  const embeddingsList = [];

  // Normalized shapes: result can be embedMany result ({embeddings: []}) or embed result ({embedding: []})
  if (Array.isArray(result?.embeddings) && result.embeddings.length > 0) {
    if (Array.isArray(result.embeddings[0])) {
      embeddingsList.push(...result.embeddings);
    } else if (result.embeddings[0]?.embedding && Array.isArray(result.embeddings[0].embedding)) {
      embeddingsList.push(...result.embeddings.map(e => e.embedding));
    }
  } else if (Array.isArray(result?.embedding)) {
    embeddingsList.push(result.embedding);
  }

  let vectorToStore = null;
  if (embeddingsList.length === 1) {
    vectorToStore = embeddingsList[0];
  } else if (embeddingsList.length > 1) {
    const length = embeddingsList[0].length;
    const sums = new Array(length).fill(0);
    for (const emb of embeddingsList) {
      for (let i = 0; i < length; i++) {
        sums[i] += (emb[i] || 0);
      }
    }
    vectorToStore = sums.map(s => s / embeddingsList.length);
  }

  if (vectorToStore) {
    try {
      await storeSessionVector(teamId, sessionUUID, vectorToStore);
      if (result) result._vectorStored = true;
    } catch (err) {
      console.error('Error storing computed session vector', err);
      if (result) result._vectorStored = false;
    }
  }

  return { result, vector: vectorToStore };
}
