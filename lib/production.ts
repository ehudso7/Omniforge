import { z } from "zod";
import { generateText } from "@/lib/ai";

export interface ProductionPlan {
  title: string;
  summary: string;
  script: string;
  audioNarration: string;
  visualPrompt: string;
  videoConcept: string;
  keywords: string[];
  callToAction?: string;
}

const productionPlanSchema = z.object({
  title: z.string().min(1).default("Untitled Production"),
  summary: z.string().min(1),
  script: z.string().min(1),
  audioNarration: z.string().min(1).default(""),
  visualPrompt: z.string().min(1).default(""),
  videoConcept: z.string().min(1).default(""),
  keywords: z.array(z.string()).default([]),
  callToAction: z.string().optional(),
});

export async function generateProductionPlan(
  creativePrompt: string
): Promise<ProductionPlan> {
  const systemPrompt = `You are the executive producer for OmniForge Studio.
You turn a single user prompt into a cohesive, multi-modal production plan.
Respond ONLY with valid JSON that matches this TypeScript type:
type ProductionPlan = {
  title: string;
  summary: string;
  script: string;
  audioNarration: string;
  visualPrompt: string;
  videoConcept: string;
  keywords: string[];
  callToAction?: string;
};`;

  const planPrompt = `
User creative brief: "${creativePrompt}"

Produce a cinematic, emotionally engaging plan for text, visuals, audio, and video.`;

  try {
    const result = await generateText({
      prompt: planPrompt.trim(),
      systemPrompt,
      temperature: 0.8,
      maxTokens: 1500,
      model: "gpt-4o-mini",
    });

    const parsed = productionPlanSchema.parse(JSON.parse(result.content));
    return parsed;
  } catch (error) {
    console.error("Failed to generate production plan:", error);
    return {
      title: "OmniForge Production",
      summary: creativePrompt,
      script: creativePrompt,
      audioNarration: creativePrompt,
      visualPrompt: creativePrompt,
      videoConcept: creativePrompt,
      keywords: [],
    };
  }
}
