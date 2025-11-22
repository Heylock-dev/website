import { scrapeURL } from '@/scripts/ai/tools';
import { streamText, convertToModelMessages, tool } from 'ai';
import z from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request) {
  const { messages } = await request.json();

  const tools = {
    scrapeURL: tool({
      description: 'Scrapes the content of a given URL',
      inputSchema: z.object({
        url: z.url()
      }),
      execute: scrapeURL(url)
    })
  }

  const result = streamText({
    model: "meituan/longcat-flash-chat",
    messages: convertToModelMessages(messages),
    tools: tools,
    toolChoice: 'required'
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true
  });
}