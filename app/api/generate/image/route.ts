import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateImage } from "@/lib/ai";
import { checkRateLimit, rateLimitConfig } from "@/lib/rate-limit";
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

    // Rate limiting check
    const rateLimitResult = checkRateLimit(user.id, rateLimitConfig.generation);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: new Date(rateLimitResult.reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const params = imageGenerationSchema.parse(body);

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
