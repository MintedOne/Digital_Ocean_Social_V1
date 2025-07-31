import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, streamText } from 'ai';
import { VICTORIA_PERSONA } from '@/lib/victoria/persona';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: convertToCoreMessages(messages),
      system: VICTORIA_PERSONA.systemPrompt,
      maxTokens: 500,
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Victoria chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}