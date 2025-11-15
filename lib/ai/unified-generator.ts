import { generateCompleteProduction } from "./production-generator";
import { generateMangaProduction } from "./manga-generator";
import { generateText } from "./text-client";

/**
 * Unified Generation System - Like Suno
 * Takes a single prompt and generates complete, finished, production-ready products
 * Not just assets, but complete polished productions
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
    manga?: {
      title: string;
      synopsis: string;
      coverImage?: string;
      characters: Array<{
        name: string;
        description: string;
        designUrl?: string;
      }>;
      pages: Array<{
        pageNumber: number;
        layout: "single" | "double" | "triple" | "quad";
        panels: Array<{
          imageUrl: string;
          description: string;
          dialogue?: string;
          narration?: string;
        }>;
      }>;
      totalPages: number;
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
 * Generates a complete, finished production from a single prompt
 * Like Suno: one prompt = one complete, polished product
 */
export async function generateUnifiedProduction(
  params: UnifiedGenerationParams
): Promise<UnifiedGenerationResult> {
  const startTime = Date.now();
  const { prompt } = params;

  // Check if this is a manga request
  const isMangaRequest = prompt.toLowerCase().includes("manga") || 
                        prompt.toLowerCase().includes("comic") ||
                        prompt.toLowerCase().includes("bleach") ||
                        prompt.toLowerCase().includes("gintama") ||
                        prompt.toLowerCase().includes("soul eater");

  if (isMangaRequest) {
    // Generate complete manga production
    const mangaProduction = await generateMangaProduction({
      prompt,
      pages: 5, // Generate 5 pages for complete manga
    });

    // Convert to unified result format
    return {
      id: mangaProduction.id,
      prompt,
      generatedAt: new Date(),
      outputs: {
        manga: {
          title: mangaProduction.title,
          synopsis: mangaProduction.synopsis,
          coverImage: mangaProduction.coverImage,
          characters: mangaProduction.characters,
          pages: mangaProduction.pages.map((page) => ({
            pageNumber: page.pageNumber,
            layout: page.layout,
            panels: page.panels.map((panel) => ({
              imageUrl: panel.imageUrl,
              description: panel.description,
              dialogue: panel.dialogue,
              narration: panel.narration,
            })),
          })),
          totalPages: mangaProduction.pages.length,
        },
      },
      metadata: {
        generationTime: mangaProduction.metadata.generationTime,
        models: ["gpt-4o-mini", "dall-e-3"],
      },
    };
  }

  // For other types, use the production generator
  const completeProduction = await generateCompleteProduction({
    prompt,
    productionType: "auto",
  });

  // Convert to unified result format
  const outputs: UnifiedGenerationResult["outputs"] = {};

  if (completeProduction.type === "manga" && "pages" in completeProduction.production) {
    const manga = completeProduction.production as any;
    outputs.manga = {
      title: manga.title,
      synopsis: manga.synopsis,
      coverImage: manga.coverImage,
      characters: manga.characters,
      pages: manga.pages,
      totalPages: manga.pages.length,
    };
  } else if (completeProduction.type === "article") {
    const article = completeProduction.production as any;
    outputs.text = {
      content: article.content,
      title: article.title,
      model: "gpt-4o-mini",
    };
    outputs.images = article.images?.map((img: any, i: number) => ({
      url: img.url,
      title: `Image ${i + 1}`,
      description: img.caption,
      model: "dall-e-3",
    }));
  } else if (completeProduction.type === "story") {
    const story = completeProduction.production as any;
    outputs.text = {
      content: story.content,
      title: story.title,
      model: "gpt-4o-mini",
    };
    if (story.coverImage) {
      outputs.images = [{
        url: story.coverImage,
        title: "Cover",
        description: "Story cover illustration",
        model: "dall-e-3",
      }];
    }
    if (story.audioNarration) {
      outputs.audio = {
        url: story.audioNarration.url,
        title: "Audio Narration",
        duration: story.audioNarration.duration,
        model: "tts-1",
      };
    }
  }

  const generationTime = Date.now() - startTime;

  return {
    id: completeProduction.id,
    prompt,
    generatedAt: completeProduction.generatedAt,
    outputs,
    metadata: {
      generationTime,
      models: ["gpt-4o-mini", "dall-e-3"],
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
