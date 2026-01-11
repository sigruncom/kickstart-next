import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Initialize Gemini is handled by @ai-sdk/google using process.env.GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY
// Ensure GEMINI_API_KEY is defined in .env

export const runtime = 'edge';

export async function POST(req) {
    try {
        const body = await req.json();
        const { messages, message, context } = body;

        // 1. Construct System Instruction
        // Ensure context exists if we are in manual mode
        const safeContext = context || {};

        const systemInstruction = `
You are an expert business coach for the "SOMBA Kickstart" program.
Your goal is to help the user build their online course business.

USER CONTEXT:
- Ideal Client: ${safeContext.idealClient || "Not defined yet (ask them to define it)"}
- Course Name: ${safeContext.courseName || "Not named yet"}
- Big Promise: ${safeContext.bigPromise || "Not defined yet"}
- Current Focus: ${safeContext.currentStep || "General coaching"}

GUIDELINES:
- Be encouraging, concise, and action-oriented.
- Refer to their specific context (e.g., "Since your ideal client is [client]...").
- IF they haven't defined their Ideal Client, guide them to do so.
`;

        // 2. Prepare Messages
        // If 'messages' is provided (standard Vercel AI SDK), use it.
        // Otherwise, construct it from the single 'message' (custom frontend).
        const coreMessages = messages || [
            { role: 'user', content: message || "Hello" }
        ];

        // 3. Call Gemini
        const result = await streamText({
            model: google('gemini-1.5-flash'),
            system: systemInstruction,
            messages: coreMessages,
        });

        // 4. Return Stream
        return result.toDataStreamResponse();

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
