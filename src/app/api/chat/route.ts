import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, caseContext } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    caseContext?: string;
  };

  const systemPrompt = `You are Tabula AI, an intelligent legal assistant integrated into Tabula — a legal case management platform used by law firms in New York state.

${caseContext ? `You have access to the following case data:\n\n${caseContext}\n\n` : ""}Your role:
- Answer questions about this specific case based on the data above
- Help track deadlines and important dates (Notice of Claim deadlines, statute of limitations, tax filing dates, etc.)
- Explain relevant legal concepts and procedures for New York law
- Flag potential issues, missing information, or upcoming deadlines
- Suggest next steps in the case workflow
- Help draft notes or summaries based on the case data

Keep responses concise and professional. When referencing specific case data, cite which form or section it came from. If asked about something not in the case data, say so clearly. Never fabricate legal facts, deadlines, or case details.`;

  if (!process.env.ANTHROPIC_API_KEY) {
    // Demo mode — return a helpful mock response
    const mockStream = new ReadableStream({
      start(controller) {
        const msg =
          "Tabula AI is not configured in this environment. Add ANTHROPIC_API_KEY to your .env.local to enable the assistant.";
        controller.enqueue(new TextEncoder().encode(msg));
        controller.close();
      },
    });
    return new Response(mockStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
