import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/auth-helpers";
import {
    generateText,
    generateImage,
    generateSpeech,
    generateStoryboard,
} from "@/lib/ai";

const omniSchema = z.object({
  projectId: z.string().cuid(),
  prompt: z.string().min(1, "Prompt is required"),
  modes: z
    .object({
      text: z.boolean().optional(),
      image: z.boolean().optional(),
      audio: z.boolean().optional(),
      video: z.boolean().optional(),
    })
    .optional(),
  voice: z.string().optional(),
});

const assetSelect = {
  id: true,
  type: true,
  title: true,
  inputPrompt: true,
  outputData: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AssetSelect;

type AssetPayload = Prisma.AssetGetPayload<{ select: typeof assetSelect }>;

type OmniBlueprint = {
  title: string;
  summary: string;
  tone: string;
  textBrief: string;
  imagePrompt: string;
  audioNarration: string;
  videoStoryboardConcept: string;
  keywords: string[];
};

function fallbackBlueprint(concept: string): OmniBlueprint {
  const truncatedConcept = concept.slice(0, 200);
  return {
    title: `Omni Production: ${truncatedConcept}`,
    summary: truncatedConcept,
    tone: "cinematic",
    textBrief: `Write a compelling narrative expanding on: ${truncatedConcept}`,
    imagePrompt: `Highly detailed, production-ready concept art for: ${truncatedConcept}`,
    audioNarration: `Dramatic narration describing: ${truncatedConcept}`,
    videoStoryboardConcept: `Storyboard the following concept: ${truncatedConcept}`,
    keywords: truncatedConcept
      .split(" ")
      .filter(Boolean)
      .slice(0, 8)
      .map((word) => word.replace(/[^a-z0-9-]/gi, "").toLowerCase()),
  };
}

function sanitizeJsonContent(content: string) {
  return content
    .trim()
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

async function buildBlueprint(concept: string): Promise<OmniBlueprint> {
  const blueprintPrompt = `You are the executive creative director for an AI production studio.
  Based on the concept below, craft a multi-modal creative blueprint and return ONLY valid JSON
  with this schema:
  {
    "title": string,
    "summary": string,
    "tone": string,
    "textBrief": string,
    "imagePrompt": string,
    "audioNarration": string,
    "videoStoryboardConcept": string,
    "keywords": string[]
  }

  Concept: """${concept}"""`;

  try {
    const response = await generateText({
      prompt: blueprintPrompt,
      systemPrompt:
        "You design cohesive cross-media campaigns. Respond only with compact JSON, no prose.",
      temperature: 0.8,
      maxTokens: 800,
      model: "gpt-4o-mini",
    });

    const cleaned = sanitizeJsonContent(response.content);
    const parsed = JSON.parse(cleaned);

    return {
      title: parsed.title || `Omni Production: ${concept}`,
      summary: parsed.summary || concept,
      tone: parsed.tone || "cinematic",
      textBrief: parsed.textBrief || concept,
      imagePrompt:
        parsed.imagePrompt ||
        `High-detail, production-ready artwork for: ${concept}`,
      audioNarration:
        parsed.audioNarration ||
        `A heartfelt narration describing: ${concept}`,
      videoStoryboardConcept:
        parsed.videoStoryboardConcept ||
        `Storyboard the following concept: ${concept}`,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.slice(0, 10)
        : [],
    };
  } catch (error) {
    console.warn("Failed to build blueprint from LLM output:", error);
    return fallbackBlueprint(concept);
  }
}

type GenerationResult = {
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";
  status: "success" | "error";
  asset?: AssetPayload;
  error?: string;
};

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { projectId, prompt, modes, voice } = omniSchema.parse(body);

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return notFound("Project not found");
    }

    const selectedModes = {
      text: modes?.text ?? true,
      image: modes?.image ?? true,
      audio: modes?.audio ?? true,
      video: modes?.video ?? true,
    };

    if (
      !selectedModes.text &&
      !selectedModes.image &&
      !selectedModes.audio &&
      !selectedModes.video
    ) {
      return NextResponse.json(
        { error: "Select at least one generation mode" },
        { status: 400 }
      );
    }

    const blueprint = await buildBlueprint(prompt);
    const results: GenerationResult[] = [];
    const assetMetadataBase = {
      blueprint,
      originalPrompt: prompt,
    };

    const textTask = async () => {
      const textResult = await generateText({
        prompt: `Using the creative brief below, write a polished, publication-ready narrative (400-700 words). Match the desired tone and weave in the keywords organically.

Brief:
${JSON.stringify(blueprint, null, 2)}`,
        systemPrompt:
          "You are a world-class creative director crafting launch-ready marketing prose.",
        temperature: 0.75,
        maxTokens: 2000,
        model: "gpt-4o-mini",
      });

      return prisma.asset.create({
        data: {
          projectId,
          type: "TEXT",
          title: `${blueprint.title} · Narrative`,
          inputPrompt: prompt,
          outputData: {
            content: textResult.content,
            summary: blueprint.summary,
          },
          metadata: {
            ...assetMetadataBase,
            model: textResult.model,
            usage: textResult.usage,
            tone: blueprint.tone,
          },
        },
        select: assetSelect,
      });
    };

    const imageTask = async () => {
      const composedPrompt = `${blueprint.imagePrompt}

Tone: ${blueprint.tone}
Keywords: ${blueprint.keywords.join(", ")}`;

      const imageResult = await generateImage({
        prompt: composedPrompt,
        width: 1024,
        height: 1024,
        model: "dall-e-3",
      });

      return prisma.asset.create({
        data: {
          projectId,
          type: "IMAGE",
          title: `${blueprint.title} · Key Art`,
          inputPrompt: composedPrompt,
          outputData: {
            url: imageResult.url,
            revisedPrompt: imageResult.revisedPrompt,
          },
          metadata: {
            ...assetMetadataBase,
            model: imageResult.model,
          },
        },
        select: assetSelect,
      });
    };

    const audioTask = async () => {
      const audioResult = await generateSpeech({
        text: blueprint.audioNarration,
        voice: voice || "alloy",
        model: "tts-1",
      });

      return prisma.asset.create({
        data: {
          projectId,
          type: "AUDIO",
          title: `${blueprint.title} · Voiceover`,
          inputPrompt: blueprint.audioNarration,
          outputData: {
            url: audioResult.url,
            duration: audioResult.duration,
          },
          metadata: {
            ...assetMetadataBase,
            voice: voice || "alloy",
            model: audioResult.model,
          },
        },
        select: assetSelect,
      });
    };

    const videoTask = async () => {
      const videoResult = await generateStoryboard({
        concept: blueprint.videoStoryboardConcept,
        numberOfFrames: 6,
        duration: 60,
      });

      return prisma.asset.create({
        data: {
          projectId,
          type: "VIDEO",
          title: `${blueprint.title} · Storyboard`,
          inputPrompt: blueprint.videoStoryboardConcept,
          outputData: {
            script: videoResult.script,
            frames: videoResult.frames,
            totalDuration: videoResult.totalDuration,
          },
          metadata: {
            ...assetMetadataBase,
            frameCount: videoResult.frames.length,
          },
        },
        select: assetSelect,
      });
    };

    const tasks: Array<{
      key: keyof typeof selectedModes;
      type: GenerationResult["type"];
      handler: () => Promise<AssetPayload>;
    }> = [
      { key: "text", type: "TEXT", handler: textTask },
      { key: "image", type: "IMAGE", handler: imageTask },
      { key: "audio", type: "AUDIO", handler: audioTask },
      { key: "video", type: "VIDEO", handler: videoTask },
    ];

    for (const task of tasks) {
      if (!selectedModes[task.key]) {
        continue;
      }

      try {
        const asset = await task.handler();
        results.push({ type: task.type, status: "success", asset });
      } catch (error) {
        console.error(`Omni generation failed for ${task.type}:`, error);
        results.push({
          type: task.type,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ blueprint, results });
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
    console.error("Omni generation error:", error);
    return serverError(
      error instanceof Error ? error.message : "Omni generation failed"
    );
  }
}
