import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateStoryboard } from "@/lib/ai";
import { sanitizePrompt } from "@/lib/validation";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

const videoGenerationSchema = z.object({
  concept: z.string().min(1),
  numberOfFrames: z.number().min(1).max(20).optional(),
  duration: z.number().min(5).max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(`generate:video:${user.id}:${identifier}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json();
    const params = videoGenerationSchema.parse(body);

    // Sanitize concept input
    params.concept = sanitizePrompt(params.concept);

    const result = await generateStoryboard(params);
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
    console.error("Video generation error:", error);
    return serverError(
      error instanceof Error ? error.message : "Video generation failed"
    );
  }
}
