import OpenAI from "openai";
import { ImageGenerationParams, ImageGenerationResult } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImage(
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  const {
    prompt,
    width = 1024,
    height = 1024,
    model = "dall-e-3",
    n = 1,
  } = params;

  try {
    // DALL-E 3 only supports n=1
    const response = await openai.images.generate({
      model,
      prompt,
      n: model === "dall-e-3" ? 1 : n,
      size: `${width}x${height}` as "1024x1024" | "1792x1024" | "1024x1792",
      response_format: "url",
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data in response");
    }

    const imageData = response.data[0];

    if (!imageData?.url) {
      throw new Error("No image URL in response");
    }

    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt,
      model,
    };
  } catch (error) {
    console.error("Image generation error:", error);
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// For future integration with other providers like Stability AI, Midjourney, etc.
export async function generateImageWithProvider(
  provider: "openai" | "stability" | "replicate",
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  switch (provider) {
    case "openai":
      return generateImage(params);
    case "stability":
      // Stub for Stability AI integration
      throw new Error("Stability AI integration not yet implemented");
    case "replicate":
      // Stub for Replicate integration
      throw new Error("Replicate integration not yet implemented");
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
