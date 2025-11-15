// Production orchestrator - coordinates multi-modal content generation
// Creates a cohesive production package from a single prompt

import { generateText } from "@/lib/ai/text-client";
import { generateImage } from "@/lib/ai/image-client";
import { analyzePrompt, PromptAnalysis } from "./prompt-analyzer";

export interface ProductionAsset {
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";
  title: string;
  content: any;
  metadata: any;
  prompt: string;
}

export interface ProductionResult {
  projectTitle: string;
  analysis: PromptAnalysis;
  assets: ProductionAsset[];
  summary: string;
  completedAt: Date;
}

export interface ProductionProgress {
  stage: "analyzing" | "generating_text" | "generating_images" | "generating_audio" | "finalizing" | "complete";
  progress: number; // 0-100
  currentAsset?: string;
  message: string;
}

export type ProgressCallback = (progress: ProductionProgress) => void;

/**
 * Orchestrate production-quality content generation from a single prompt
 * This is the heart of the Suno-like experience
 */
export async function orchestrateProduction(
  userPrompt: string,
  onProgress?: ProgressCallback
): Promise<ProductionResult> {
  const assets: ProductionAsset[] = [];
  
  // Stage 1: Analyze the prompt
  onProgress?.({
    stage: "analyzing",
    progress: 10,
    message: "Analyzing your prompt and planning production...",
  });

  const analysis = await analyzePrompt(userPrompt);
  
  onProgress?.({
    stage: "analyzing",
    progress: 20,
    message: "Production plan ready. Starting content generation...",
  });

  // Stage 2: Generate text content (if needed)
  if (analysis.contentTypes.text && analysis.enhancedPrompts.text) {
    onProgress?.({
      stage: "generating_text",
      progress: 30,
      currentAsset: "text",
      message: `Creating ${analysis.suggestedFormats.textFormat || "text"} content...`,
    });

    try {
      const textResult = await generateText({
        prompt: analysis.enhancedPrompts.text,
        systemPrompt: `You are a professional content creator. Create ${analysis.suggestedFormats.textFormat || "compelling"} content with a ${analysis.tone} tone for ${analysis.targetAudience}. Make it production-quality and complete.`,
        temperature: 0.8,
        maxTokens: 2000,
        model: "gpt-4o-mini",
      });

      assets.push({
        type: "TEXT",
        title: `${analysis.suggestedFormats.textFormat || "Content"} - ${extractTitle(userPrompt)}`,
        content: textResult.content,
        metadata: {
          format: analysis.suggestedFormats.textFormat,
          tone: analysis.tone,
          style: analysis.style,
          usage: textResult.usage,
        },
        prompt: analysis.enhancedPrompts.text,
      });
    } catch (error) {
      console.error("Text generation failed:", error);
    }
  }

  // Stage 3: Generate images (if needed)
  if (analysis.contentTypes.image && analysis.enhancedPrompts.image) {
    onProgress?.({
      stage: "generating_images",
      progress: 50,
      currentAsset: "image",
      message: `Creating ${analysis.suggestedFormats.imageStyle || "visual"} imagery...`,
    });

    try {
      // Generate primary image
      const imageResult = await generateImage({
        prompt: enhanceImagePrompt(analysis.enhancedPrompts.image, analysis),
        width: 1024,
        height: 1024,
        model: "dall-e-3",
      });

      assets.push({
        type: "IMAGE",
        title: `Visual - ${extractTitle(userPrompt)}`,
        content: {
          url: imageResult.url,
          revisedPrompt: imageResult.revisedPrompt,
        },
        metadata: {
          style: analysis.suggestedFormats.imageStyle,
          model: imageResult.model,
        },
        prompt: analysis.enhancedPrompts.image,
      });

      // Generate a complementary image if it's a story or marketing content
      if (analysis.primaryIntent === "story" || analysis.primaryIntent === "marketing") {
        onProgress?.({
          stage: "generating_images",
          progress: 70,
          currentAsset: "image",
          message: "Creating complementary visual...",
        });

        const secondaryImagePrompt = `${analysis.enhancedPrompts.image}, different perspective or scene, complementary to the main visual`;
        const secondaryResult = await generateImage({
          prompt: secondaryImagePrompt,
          width: 1024,
          height: 1024,
          model: "dall-e-3",
        });

        assets.push({
          type: "IMAGE",
          title: `Complementary Visual - ${extractTitle(userPrompt)}`,
          content: {
            url: secondaryResult.url,
            revisedPrompt: secondaryResult.revisedPrompt,
          },
          metadata: {
            style: analysis.suggestedFormats.imageStyle,
            model: secondaryResult.model,
            secondary: true,
          },
          prompt: secondaryImagePrompt,
        });
      }
    } catch (error) {
      console.error("Image generation failed:", error);
    }
  }

  // Stage 4: Generate audio description/narration (placeholder for now)
  if (analysis.contentTypes.audio && analysis.enhancedPrompts.audio) {
    onProgress?.({
      stage: "generating_audio",
      progress: 85,
      currentAsset: "audio",
      message: "Creating audio narration...",
    });

    // For now, create a text-based audio script
    // In production, this would call OpenAI TTS or similar
    const audioScript = await generateText({
      prompt: `Create a narration script for: ${analysis.enhancedPrompts.audio}. Make it engaging and production-ready for voice-over.`,
      systemPrompt: "You are a professional voice-over script writer. Create clear, engaging narration scripts.",
      temperature: 0.7,
      maxTokens: 1000,
      model: "gpt-4o-mini",
    });

    assets.push({
      type: "AUDIO",
      title: `Narration Script - ${extractTitle(userPrompt)}`,
      content: {
        script: audioScript.content,
        type: analysis.suggestedFormats.audioType || "narration",
        // url would be added here when actual TTS is implemented
      },
      metadata: {
        audioType: analysis.suggestedFormats.audioType,
        duration: "estimate: 30-60s",
      },
      prompt: analysis.enhancedPrompts.audio!,
    });
  }

  // Stage 5: Finalize
  onProgress?.({
    stage: "finalizing",
    progress: 95,
    message: "Finalizing your production...",
  });

  // Generate a summary of what was created
  const summary = generateSummary(userPrompt, analysis, assets);

  onProgress?.({
    stage: "complete",
    progress: 100,
    message: "Production complete! 🎉",
  });

  return {
    projectTitle: extractTitle(userPrompt),
    analysis,
    assets,
    summary,
    completedAt: new Date(),
  };
}

function extractTitle(prompt: string): string {
  // Extract a meaningful title from the prompt
  const words = prompt.trim().split(" ");
  const title = words.slice(0, 5).join(" ");
  return title.length > 50 ? title.substring(0, 47) + "..." : title;
}

function enhanceImagePrompt(basePrompt: string, analysis: PromptAnalysis): string {
  const style = analysis.suggestedFormats.imageStyle || "photorealistic";
  return `${basePrompt}, ${style} style, professional quality, detailed, high resolution`;
}

function generateSummary(prompt: string, analysis: PromptAnalysis, assets: ProductionAsset[]): string {
  const assetTypes = assets.map(a => a.type.toLowerCase()).join(", ");
  return `Created ${assets.length} production assets (${assetTypes}) for "${prompt}". Style: ${analysis.style}, Tone: ${analysis.tone}, Format: ${analysis.suggestedFormats.textFormat || "multi-modal content"}.`;
}
