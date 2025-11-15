import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateSpeech, generateMusic } from "@/lib/ai";
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
    await requireAuth();

    const body = await request.json();
    const params = audioGenerationSchema.parse(body);

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
