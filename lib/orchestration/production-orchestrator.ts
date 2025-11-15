// Production orchestrator - coordinates multi-modal content generation
// Creates COMPLETE, PRODUCTION-READY packages from a single prompt

import { generateText } from "@/lib/ai/text-client";
import { generateImage } from "@/lib/ai/image-client";
import { analyzePrompt, PromptAnalysis } from "./prompt-analyzer";
import { 
  detectProductionType, 
  PRODUCTION_TEMPLATES, 
  ProductionType,
  ProductionComponent 
} from "./production-templates";

export interface ProductionAsset {
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";
  title: string;
  content: any;
  metadata: any;
  prompt: string;
}

export interface ProductionResult {
  projectTitle: string;
  productionType: ProductionType;
  analysis: PromptAnalysis;
  assets: ProductionAsset[];
  summary: string;
  isComplete: boolean;
  completedAt: Date;
}

export interface ProductionProgress {
  stage: "analyzing" | "planning" | "generating_story" | "generating_characters" | "generating_scenes" | "generating_visuals" | "finalizing" | "complete";
  progress: number; // 0-100
  currentAsset?: string;
  message: string;
}

export type ProgressCallback = (progress: ProductionProgress) => void;

/**
 * Orchestrate COMPLETE production from a single prompt
 * Like Suno creates complete songs, we create complete productions
 */
export async function orchestrateProduction(
  userPrompt: string,
  onProgress?: ProgressCallback
): Promise<ProductionResult> {
  const assets: ProductionAsset[] = [];
  
  // Stage 1: Detect production type
  onProgress?.({
    stage: "analyzing",
    progress: 5,
    message: "Analyzing your request...",
  });

  const productionType = detectProductionType(userPrompt);
  const template = PRODUCTION_TEMPLATES[productionType];
  
  onProgress?.({
    stage: "planning",
    progress: 10,
    message: `Planning ${productionType} production...`,
  });

  // Stage 2: Analyze and enhance the prompt
  const analysis = await analyzePrompt(userPrompt);
  
  onProgress?.({
    stage: "planning",
    progress: 15,
    message: "Production plan ready. Creating your complete package...",
  });

  // Stage 3: Generate ALL required components for COMPLETE production
  const totalComponents = template.components.reduce((sum, comp) => 
    sum + (typeof comp.count === 'number' ? comp.count : 3), 0
  );
  let completedComponents = 0;

  for (const component of template.components) {
    const count = typeof component.count === 'number' ? component.count : 3;
    
    for (let i = 0; i < count; i++) {
      const progressPercent = 15 + (completedComponents / totalComponents) * 75;
      
      try {
        if (component.type === "TEXT") {
          await generateTextComponent(
            component,
            userPrompt,
            analysis,
            assets,
            i,
            count,
            onProgress,
            progressPercent
          );
        } else if (component.type === "IMAGE") {
          await generateImageComponent(
            component,
            userPrompt,
            analysis,
            assets,
            i,
            count,
            onProgress,
            progressPercent
          );
        } else if (component.type === "AUDIO") {
          await generateAudioComponent(
            component,
            userPrompt,
            analysis,
            assets,
            i,
            count,
            onProgress,
            progressPercent
          );
        }
      } catch (error) {
        console.error(`Failed to generate ${component.name}:`, error);
        // Continue with other components
      }
      
      completedComponents++;
    }
  }

  // Stage 4: Finalize
  onProgress?.({
    stage: "finalizing",
    progress: 95,
    message: "Finalizing your complete production...",
  });

  const summary = generateCompleteSummary(userPrompt, productionType, assets);
  const isComplete = assets.length >= template.minAssets;

  onProgress?.({
    stage: "complete",
    progress: 100,
    message: `Complete ${productionType} production ready! 🎉`,
  });

  return {
    projectTitle: extractTitle(userPrompt),
    productionType,
    analysis,
    assets,
    summary,
    isComplete,
    completedAt: new Date(),
  };
}

// Component generation functions

async function generateTextComponent(
  component: ProductionComponent,
  userPrompt: string,
  analysis: PromptAnalysis,
  assets: ProductionAsset[],
  index: number,
  total: number,
  onProgress?: ProgressCallback,
  progress?: number
) {
  onProgress?.({
    stage: "generating_story",
    progress: progress || 30,
    currentAsset: component.name,
    message: `Creating ${component.name}${total > 1 ? ` (${index + 1}/${total})` : ""}...`,
  });

  // Build contextual prompt
  let enhancedPrompt = component.prompt;
  
  // For manga/story content, make it COMPLETE
  if (component.name.includes("Story") || component.name.includes("Script")) {
    enhancedPrompt = `${userPrompt}\n\n${component.prompt}\n\nIMPORTANT: Create a COMPLETE, PRODUCTION-READY ${component.name.toLowerCase()}. This should be finished and ready to publish/use. Include all necessary details, dialogue, descriptions, and make it comprehensive.`;
  } else {
    enhancedPrompt = `Based on: "${userPrompt}"\n\n${component.prompt}`;
  }

  const result = await generateText({
    prompt: enhancedPrompt,
    systemPrompt: `You are a professional content creator specializing in ${component.description}. Create complete, production-quality content that is ready to use immediately. Be comprehensive and thorough.`,
    temperature: 0.8,
    maxTokens: component.name.includes("Story") || component.name.includes("Script") ? 4000 : 2000,
    model: "gpt-4o",
  });

  assets.push({
    type: "TEXT",
    title: component.name,
    content: { text: result.content },
    metadata: {
      component: component.name,
      description: component.description,
      usage: result.usage,
    },
    prompt: enhancedPrompt,
  });
}

async function generateImageComponent(
  component: ProductionComponent,
  userPrompt: string,
  analysis: PromptAnalysis,
  assets: ProductionAsset[],
  index: number,
  total: number,
  onProgress?: ProgressCallback,
  progress?: number
) {
  onProgress?.({
    stage: "generating_visuals",
    progress: progress || 50,
    currentAsset: component.name,
    message: `Creating ${component.name}${total > 1 ? ` (${index + 1}/${total})` : ""}...`,
  });

  // Extract character/scene details from previous text assets for context
  const storyAsset = assets.find(a => a.title.includes("Story") || a.title.includes("Script"));
  const characterAssets = assets.filter(a => a.title.includes("Character") && a.type === "TEXT");
  
  let contextualPrompt = component.prompt;
  
  // For manga character designs, extract character details
  if (component.name.includes("Character") && characterAssets.length > 0 && index < characterAssets.length) {
    const charText = characterAssets[index]?.content?.text || "";
    contextualPrompt = `${component.prompt}\n\nCharacter details: ${charText.substring(0, 500)}`;
  }
  
  // For scene illustrations, extract scene details from story
  if (component.name.includes("Scene") && storyAsset) {
    const storyText = storyAsset.content?.text || "";
    const scenes = extractScenes(storyText);
    if (scenes[index]) {
      contextualPrompt = component.prompt.replace("{scene_description}", scenes[index]);
    }
  }
  
  // Enhance with user prompt context
  const fullPrompt = `${userPrompt} - ${contextualPrompt}, professional quality, detailed, high resolution`;

  const result = await generateImage({
    prompt: fullPrompt,
    width: 1024,
    height: 1024,
    model: "dall-e-3",
  });

  assets.push({
    type: "IMAGE",
    title: `${component.name}${total > 1 ? ` ${index + 1}` : ""}`,
    content: {
      url: result.url,
      revisedPrompt: result.revisedPrompt,
    },
    metadata: {
      component: component.name,
      description: component.description,
      model: result.model,
    },
    prompt: fullPrompt,
  });
}

async function generateAudioComponent(
  component: ProductionComponent,
  userPrompt: string,
  analysis: PromptAnalysis,
  assets: ProductionAsset[],
  index: number,
  total: number,
  onProgress?: ProgressCallback,
  progress?: number
) {
  onProgress?.({
    stage: "generating_visuals",
    progress: progress || 85,
    currentAsset: component.name,
    message: `Creating ${component.name}...`,
  });

  // Get story/script content for audio narration
  const textAsset = assets.find(a => a.type === "TEXT" && (a.title.includes("Story") || a.title.includes("Script")));
  const baseText = textAsset?.content?.text || userPrompt;

  const enhancedPrompt = `${component.prompt}\n\nContent to narrate:\n${baseText.substring(0, 2000)}`;

  const result = await generateText({
    prompt: enhancedPrompt,
    systemPrompt: "You are a professional voice-over script writer. Create narration scripts that are ready for text-to-speech or voice acting.",
    temperature: 0.7,
    maxTokens: 1500,
    model: "gpt-4o-mini",
  });

  assets.push({
    type: "AUDIO",
    title: component.name,
    content: {
      script: result.content,
      type: "narration",
      // TTS URL would be added here when implemented
    },
    metadata: {
      component: component.name,
      description: component.description,
      duration: "estimate: 2-5 minutes",
    },
    prompt: enhancedPrompt,
  });
}

// Helper functions

function extractTitle(prompt: string): string {
  const words = prompt.trim().split(" ");
  const title = words.slice(0, 8).join(" ");
  return title.length > 60 ? title.substring(0, 57) + "..." : title;
}

function extractScenes(storyText: string): string[] {
  // Extract key scenes from story for illustration
  // Look for scene breaks, dialogue sections, or action sequences
  const scenes: string[] = [];
  const paragraphs = storyText.split("\n\n");
  
  // Take first paragraph (opening)
  if (paragraphs[0]) scenes.push(paragraphs[0].substring(0, 300));
  
  // Take middle paragraphs (key moments)
  const middle = Math.floor(paragraphs.length / 2);
  if (paragraphs[middle]) scenes.push(paragraphs[middle].substring(0, 300));
  
  // Take final paragraphs (climax/resolution)
  if (paragraphs[paragraphs.length - 1]) {
    scenes.push(paragraphs[paragraphs.length - 1].substring(0, 300));
  }
  
  return scenes.length > 0 ? scenes : [storyText.substring(0, 300)];
}

function generateCompleteSummary(
  prompt: string,
  productionType: ProductionType,
  assets: ProductionAsset[]
): string {
  const template = PRODUCTION_TEMPLATES[productionType];
  const assetCounts = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const parts = Object.entries(assetCounts).map(([type, count]) => 
    `${count} ${type.toLowerCase()}${count > 1 ? 's' : ''}`
  );
  
  return `Complete ${productionType} production created with ${assets.length} assets: ${parts.join(", ")}. This is a production-ready package based on: "${prompt}".`;
}
