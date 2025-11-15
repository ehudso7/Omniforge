import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateUnified, UnifiedGenerationParams } from "@/lib/ai/unified-generator";
import { sanitizePrompt } from "@/lib/validation";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

const unifiedGenerationSchema = z.object({
  prompt: z.string().min(1).max(5000),
  contentType: z.enum(["text", "image", "audio", "video", "auto"]).optional(),
  title: z.string().max(200).optional(),
  textOptions: z
    .object({
      style: z.enum(["article", "story", "script", "poem", "marketing"]).optional(),
      length: z.enum(["short", "medium", "long"]).optional(),
    })
    .optional(),
  imageOptions: z
    .object({
      style: z.enum(["photorealistic", "artistic", "illustration", "3d"]).optional(),
      aspectRatio: z.enum(["square", "landscape", "portrait"]).optional(),
    })
    .optional(),
  audioOptions: z
    .object({
      genre: z.string().optional(),
      mood: z.string().optional(),
      duration: z.number().min(30).max(600).optional(),
      includeLyrics: z.boolean().optional(),
    })
    .optional(),
  videoOptions: z
    .object({
      style: z.enum(["cinematic", "documentary", "animated", "vlog"]).optional(),
      duration: z.number().min(5).max(300).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(`generate:unified:${user.id}:${identifier}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json();
    const params = unifiedGenerationSchema.parse(body);

    // Sanitize prompt
    params.prompt = sanitizePrompt(params.prompt);

    // Generate unified content
    const result = await generateUnified(params as UnifiedGenerationParams);

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
    console.error("Unified generation error:", error);
    return serverError(
      error instanceof Error ? error.message : "Generation failed"
    );
  }
}
