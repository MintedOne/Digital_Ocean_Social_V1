import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, streamText } from 'ai';
import { VICTORIA_PERSONA } from '@/lib/victoria/persona';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('🔍 API: Processing request with', messages.length, 'messages');
    console.log('🔑 API Key present:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');

    if (!apiKey) {
      console.error('❌ No API key found');
      return new Response('API key not configured', { status: 500 });
    }

    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: convertToCoreMessages(messages),
      system: VICTORIA_PERSONA.systemPrompt,
      maxTokens: 250, // Increased to prevent mid-sentence cutoffs while maintaining brevity
    });

    console.log('✅ API: StreamText created successfully');
    return result.toAIStreamResponse();
  } catch (error) {
    console.error('❌ Victoria chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}