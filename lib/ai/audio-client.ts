import OpenAI from "openai";
import { Buffer } from "buffer";
import { AudioGenerationParams, AudioGenerationResult } from "./types";
import { generateText } from "./text-client";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
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
      format: "mp3",
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUrl = bufferToDataUrl(buffer, "audio/mpeg");

    return {
      url: dataUrl,
      model,
      duration: Math.max(5, Math.ceil(text.length / 15)),
    };
  } catch (error) {
    console.error("Audio generation error:", error);
    throw new Error(
      `Failed to generate audio: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Lightweight adaptive music experience:
// We derive a cinematic narration/lyrics track from the prompt,
// synthesize it, and return a playable audio bundle.
export async function generateMusic(params: {
  prompt: string;
  duration?: number;
}): Promise<AudioGenerationResult> {
  const narrationPrompt = `You are a creative music director. Based on the concept below, craft a vivid lyrical narration (no more than 120 words) that could guide a cinematic soundtrack. Focus on rhythm and imagery rather than instructions.

Concept: ${params.prompt}`;

  const narration = await generateText({
    prompt: narrationPrompt,
    systemPrompt:
      "You write lyrical, rhythmic narrations that can be read dramatically over cinematic music.",
    temperature: 0.9,
    maxTokens: 400,
  });

  const speech = await generateSpeech({
    text: narration.content,
    voice: "shimmer",
    model: "tts-1",
  });

  return {
    url: speech.url,
    model: speech.model,
    duration: speech.duration ?? params.duration ?? 30,
  };
}
