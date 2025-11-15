import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateText, streamText } from "@/lib/ai";
import { sanitizePrompt } from "@/lib/validation";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

const textGenerationSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  model: z.string().optional(),
  stream: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(`generate:text:${user.id}:${identifier}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json();
    const params = textGenerationSchema.parse(body);

    // Sanitize prompt
    params.prompt = sanitizePrompt(params.prompt);
    if (params.systemPrompt) {
      params.systemPrompt = sanitizePrompt(params.systemPrompt);
    }

    if (params.stream) {
      // Return streaming response
      const stream = await streamText(params);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } else {
      // Return complete response
      const result = await generateText(params);
      return NextResponse.json({ result });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Text generation error:", error);
    return serverError(
      error instanceof Error ? error.message : "Text generation failed"
    );
  }
}
