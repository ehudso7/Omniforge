import OpenAI from "openai";
import { AudioGenerationParams, AudioGenerationResult } from "./types";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateSpeech(
  params: AudioGenerationParams
): Promise<AudioGenerationResult> {
  const { text, voice = "alloy", model = "tts-1" } = params;

  try {
    const openai = getOpenAIClient();
    const response = await openai.audio.speech.create({
      model,
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return {
      url: dataUrl,
      dataUrl,
      model,
      duration: Math.ceil(text.length / 15), // Rough estimate: ~15 chars per second
      format: "audio/mpeg",
      sizeBytes: buffer.length,
    };
  } catch (error) {
    console.error("Audio generation error:", error);
    throw new Error(
      `Failed to generate audio: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Stub for music generation (could integrate with MusicGen, Suno, etc.)
export async function generateMusic(params: {
  prompt: string;
  duration?: number;
}): Promise<AudioGenerationResult> {
  // This is a stub - integrate with actual music generation API
  console.log("Music generation requested:", params);

  return {
    dataUrl: `data:application/json;base64,${Buffer.from(
      JSON.stringify({ message: "Music generation not yet implemented" })
    ).toString("base64")}`,
    model: "music-stub",
    duration: params.duration || 30,
    format: "application/json",
  };
}
