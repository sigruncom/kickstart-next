import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Initialize Gemini is handled by @ai-sdk/google using process.env.GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY
// Ensure GEMINI_API_KEY is defined in .env

export const runtime = 'edge';

export async function POST(req) {
    try {
        // We support both standard Vercel AI SDK 'messages' and our custom 'message/context' payload
        const body = await req.json();
        const { message, context } = body;

        // 1. Construct System Instruction
        const systemInstruction = `
You are an expert business coach for the "SOMBA Kickstart" program.
Your goal is to help the user build their online course business.

USER CONTEXT:
- Ideal Client: ${context?.idealClient || "Not defined yet (ask them to define it)"}
- Course Name: ${context?.courseName || "Not named yet"}
- Big Promise: ${context?.bigPromise || "Not defined yet"}
- Current Focus: ${context?.currentStep || "General coaching"}

GUIDELINES:
- Be encouraging, concise, and action-oriented.
- Refer to their specific context (e.g., "Since your ideal client is [client]...").
- IF they haven't defined their Ideal Client, guide them to do so.
`;

        // 2. Generate content stream with Vercel AI SDK standard 'streamText'
        const result = await streamText({
            model: google('gemini-1.5-flash'),
            system: systemInstruction,
            prompt: message || "Hello", // Handle explicit single message
        });

        // 3. Return the stream
        return result.toDataStreamResponse();

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
