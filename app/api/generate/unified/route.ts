import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateUnified, UnifiedGenerationParams } from "@/lib/ai/unified-generator";
import { sanitizePrompt } from "@/lib/validation";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createProgressTracker } from "@/lib/progress-tracker";
import { z } from "zod";

const unifiedGenerationSchema = z.object({
  prompt: z.string().min(1).max(5000),
  contentType: z.enum(["text", "image", "audio", "video", "manga", "auto"]).optional(),
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
  mangaOptions: z
    .object({
      pages: z.number().min(1).max(50).optional(),
      style: z.enum(["shonen", "shoujo", "seinen", "josei", "comic", "webtoon"]).optional(),
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

    // Get or create generation ID for progress tracking
    const generationId = request.headers.get("X-Generation-ID") || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const progressTracker = createProgressTracker(generationId, "Starting generation...");

    // Generate unified content with progress tracking
    try {
      const result = await generateUnified(params as UnifiedGenerationParams, progressTracker);
      return NextResponse.json({ result, generationId });
    } catch (error) {
      // Log the error for debugging
      console.error("Unified generation error:", error);
      
      // If it's a JSON parsing error, provide a more helpful message
      if (error instanceof Error && (error.message.includes("JSON") || error.message.includes("parse"))) {
        // For manga generation, we should still return a result using fallback
        if (params.contentType === "manga" || (!params.contentType && params.prompt.toLowerCase().includes("manga"))) {
          // The error was already handled with fallback in manga-generator
          // Re-throw to be caught by outer handler
        }
      }
      throw error;
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
    console.error("Unified generation error:", error);
    
    // Provide more helpful error messages
    let errorMessage = "Generation failed";
    if (error instanceof Error) {
      errorMessage = error.message;
      // If it's a JSON parsing error, provide a more user-friendly message
      if (error.message.includes("JSON") || error.message.includes("parse")) {
        errorMessage = "Failed to process the generated content. Please try again.";
      }
    }
    
    return serverError(errorMessage);
  }
}
