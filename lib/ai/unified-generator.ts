import { generateText } from "./text-client";
import { generateImage } from "./image-client";
import { generateSpeech } from "./audio-client";
import { generateStoryboard } from "./video-client";

/**
 * Unified Generation System - Like Suno
 * Takes a single prompt and generates complete production-ready content
 * across all modalities (text, images, audio, video)
 */

export interface UnifiedGenerationParams {
  prompt: string;
  projectId: string;
  options?: {
    includeText?: boolean;
    includeImages?: boolean;
    includeAudio?: boolean;
    includeVideo?: boolean;
    autoDetect?: boolean; // Let AI decide what to generate
  };
}

export interface UnifiedGenerationResult {
  id: string;
  prompt: string;
  generatedAt: Date;
  outputs: {
    text?: {
      content: string;
      title: string;
      model: string;
    };
    images?: Array<{
      url: string;
      title: string;
      description: string;
      model: string;
    }>;
    audio?: {
      url: string;
      title: string;
      duration: number;
      model: string;
    };
    video?: {
      storyboard: {
        script: string;
        frames: Array<{
          title: string;
          description: string;
          duration: number;
        }>;
        totalDuration: number;
      };
      title: string;
    };
  };
  metadata: {
    totalTokens?: number;
    generationTime: number;
    models: string[];
  };
}

/**
 * Analyzes the prompt to determine what content types should be generated
 */
async function analyzePrompt(prompt: string): Promise<{
  needsText: boolean;
  needsImages: boolean;
  needsAudio: boolean;
  needsVideo: boolean;
  contentType: string;
}> {
  const analysisPrompt = `Analyze this creative prompt and determine what types of content should be generated. 
Return ONLY a JSON object with this exact structure:
{
  "needsText": boolean,
  "needsImages": boolean,
  "needsAudio": boolean,
  "needsVideo": boolean,
  "contentType": "article" | "story" | "song" | "video" | "multimedia" | "other",
  "reasoning": "brief explanation"
}

Prompt: "${prompt}"

Return ONLY the JSON, no other text.`;

  try {
    const result = await generateText({
      prompt: analysisPrompt,
      systemPrompt: "You are a content strategy AI. Analyze prompts and determine optimal content generation strategy.",
      temperature: 0.3,
      maxTokens: 200,
      model: "gpt-4o-mini",
    });

    const analysis = JSON.parse(result.content);
    return {
      needsText: analysis.needsText ?? true,
      needsImages: analysis.needsImages ?? false,
      needsAudio: analysis.needsAudio ?? false,
      needsVideo: analysis.needsVideo ?? false,
      contentType: analysis.contentType || "other",
    };
  } catch (error) {
    // Fallback: generate text by default
    console.error("Prompt analysis failed, using defaults:", error);
    return {
      needsText: true,
      needsImages: false,
      needsAudio: false,
      needsVideo: false,
      contentType: "other",
    };
  }
}

/**
 * Generates a complete production-ready output from a single prompt
 */
export async function generateUnifiedProduction(
  params: UnifiedGenerationParams
): Promise<UnifiedGenerationResult> {
  const startTime = Date.now();
  const { prompt, options = {} } = params;

  // Determine what to generate
  let generationPlan;
  if (options.autoDetect !== false) {
    // Auto-detect what content types are needed
    generationPlan = await analyzePrompt(prompt);
  } else {
    // Use explicit options
    generationPlan = {
      needsText: options.includeText ?? true,
      needsImages: options.includeImages ?? false,
      needsAudio: options.includeAudio ?? false,
      needsVideo: options.includeVideo ?? false,
      contentType: "custom",
    };
  }

  const outputs: UnifiedGenerationResult["outputs"] = {};
  const models: string[] = [];
  let totalTokens = 0;

  // Generate content in parallel where possible
  const generationPromises: Promise<void>[] = [];

  // Generate text content
  if (generationPlan.needsText) {
    generationPromises.push(
      (async () => {
        try {
          const textSystemPrompt = `You are a professional content creator. Create high-quality, production-ready content based on the user's prompt. 
Make it engaging, well-structured, and ready for publication.`;

          const textResult = await generateText({
            prompt,
            systemPrompt: textSystemPrompt,
            temperature: 0.8,
            maxTokens: 2000,
            model: "gpt-4o-mini",
          });

          outputs.text = {
            content: textResult.content,
            title: extractTitle(textResult.content) || "Generated Content",
            model: textResult.model,
          };

          models.push(textResult.model);
          if (textResult.usage) {
            totalTokens += textResult.usage.totalTokens;
          }
        } catch (error) {
          console.error("Text generation failed:", error);
        }
      })()
    );
  }

  // Generate images
  if (generationPlan.needsImages) {
    generationPromises.push(
      (async () => {
        try {
          // Generate 1-2 images based on content type
          const imageCount = generationPlan.contentType === "multimedia" ? 2 : 1;
          const imagePromises: Promise<void>[] = [];

          for (let i = 0; i < imageCount; i++) {
            imagePromises.push(
              (async () => {
                const imagePrompt = i === 0 
                  ? prompt 
                  : `${prompt} - alternative perspective or detail view`;

                const imageResult = await generateImage({
                  prompt: imagePrompt,
                  width: 1024,
                  height: 1024,
                  model: "dall-e-3",
                });

                if (!outputs.images) {
                  outputs.images = [];
                }

                outputs.images.push({
                  url: imageResult.url,
                  title: `Image ${i + 1}`,
                  description: imageResult.revisedPrompt || imagePrompt,
                  model: imageResult.model,
                });

                models.push(imageResult.model);
              })()
            );
          }

          await Promise.all(imagePromises);
        } catch (error) {
          console.error("Image generation failed:", error);
        }
      })()
    );
  }

  // Generate audio (speech or music)
  if (generationPlan.needsAudio) {
    generationPromises.push(
      (async () => {
        try {
          // Determine if it's speech or music
          const isMusic = generationPlan.contentType === "song" || 
                         prompt.toLowerCase().includes("song") ||
                         prompt.toLowerCase().includes("music");

          if (isMusic) {
            // For music, we'd need a music generation API
            // For now, generate speech from the text content
            const audioText = outputs.text?.content || prompt;
            const audioResult = await generateSpeech({
              text: audioText.substring(0, 1000), // Limit length
              voice: "alloy",
              model: "tts-1",
            });

            outputs.audio = {
              url: audioResult.url,
              title: "Generated Audio",
              duration: audioResult.duration || 30,
              model: audioResult.model,
            };
          } else {
            // Generate speech
            const audioText = outputs.text?.content || prompt;
            const audioResult = await generateSpeech({
              text: audioText.substring(0, 1000),
              voice: "alloy",
              model: "tts-1",
            });

            outputs.audio = {
              url: audioResult.url,
              title: "Generated Speech",
              duration: audioResult.duration || 30,
              model: audioResult.model,
            };
          }

          models.push("tts-1");
        } catch (error) {
          console.error("Audio generation failed:", error);
        }
      })()
    );
  }

  // Generate video storyboard
  if (generationPlan.needsVideo) {
    generationPromises.push(
      (async () => {
        try {
          const videoResult = await generateStoryboard({
            concept: prompt,
            numberOfFrames: 5,
            duration: 30,
          });

          outputs.video = {
            storyboard: {
              script: videoResult.script,
              frames: videoResult.frames.map((frame) => ({
                title: frame.title,
                description: frame.description,
                duration: frame.duration || 0,
              })),
              totalDuration: videoResult.totalDuration,
            },
            title: "Generated Video Storyboard",
          };
        } catch (error) {
          console.error("Video generation failed:", error);
        }
      })()
    );
  }

  // Wait for all generations to complete
  await Promise.all(generationPromises);

  const generationTime = Date.now() - startTime;

  return {
    id: `unified-${Date.now()}`,
    prompt,
    generatedAt: new Date(),
    outputs,
    metadata: {
      totalTokens,
      generationTime,
      models: [...new Set(models)],
    },
  };
}

/**
 * Extracts a title from content
 */
function extractTitle(content: string): string | null {
  // Try to extract title from markdown heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Try to extract from first line
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length > 0 && firstLine.length < 100) {
    return firstLine;
  }

  return null;
}
