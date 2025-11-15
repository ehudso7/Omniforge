import OpenAI from "openai";
import { TextGenerationParams, TextGenerationResult } from "./types";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateText(
  params: TextGenerationParams
): Promise<TextGenerationResult> {
  const {
    prompt,
    systemPrompt = "You are a helpful assistant.",
    temperature = 0.7,
    maxTokens = 2000,
    model = "gpt-4o-mini",
  } = params;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content || "";
    const usage = response.usage;

    return {
      content,
      model: response.model,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Text generation error:", error);
    throw new Error(
      `Failed to generate text: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function streamText(
  params: TextGenerationParams
): Promise<ReadableStream> {
  const {
    prompt,
    systemPrompt = "You are a helpful assistant.",
    temperature = 0.7,
    maxTokens = 2000,
    model = "gpt-4o-mini",
  } = params;

  const openai = getOpenAIClient();
  const stream = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
