import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateImage } from "@/lib/ai";
import { sanitizePrompt } from "@/lib/validation";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

const imageGenerationSchema = z.object({
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Rate limiting (image generation is more expensive)
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(`generate:image:${user.id}:${identifier}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json();
    const params = imageGenerationSchema.parse(body);

    // Sanitize prompt
    params.prompt = sanitizePrompt(params.prompt);
    if (params.negativePrompt) {
      params.negativePrompt = sanitizePrompt(params.negativePrompt);
    }

    const result = await generateImage(params);
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
    console.error("Image generation error:", error);
    return serverError(
      error instanceof Error ? error.message : "Image generation failed"
    );
  }
}
