import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateSpeech, generateMusic } from "@/lib/ai";
import { sanitizePrompt } from "@/lib/validation";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

const audioGenerationSchema = z.object({
  type: z.enum(["speech", "music"]),
  text: z.string().min(1),
  voice: z.string().optional(),
  model: z.string().optional(),
  duration: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(`generate:audio:${user.id}:${identifier}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json();
    const params = audioGenerationSchema.parse(body);

    // Sanitize text input
    params.text = sanitizePrompt(params.text);

    let result;
    if (params.type === "speech") {
      result = await generateSpeech({
        text: params.text,
        voice: params.voice,
        model: params.model,
      });
    } else {
      result = await generateMusic({
        prompt: params.text,
        duration: params.duration,
      });
    }

    return NextResponse.json({ result });
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
    console.error("Audio generation error:", error);
    return serverError(
      error instanceof Error ? error.message : "Audio generation failed"
    );
  }
}
