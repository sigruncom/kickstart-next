import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const runtime = 'edge';

export async function POST(req) {
    try {
        const { message, context } = await req.json();

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

        // 2. Generate content stream with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `${systemInstruction}\n\nUser: ${message}\n\nCoach:`;

        const geminiStream = await model.generateContentStream(prompt);

        // 3. Create a stream using Vercel AI SDK
        const stream = GoogleGenerativeAIStream(geminiStream);

        // 4. Return the stream
        return new StreamingTextResponse(stream);

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
