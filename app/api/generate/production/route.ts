import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { requireAuth, unauthorized, notFound, serverError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateProductionPlan } from "@/lib/production";
import { generateImage, generateSpeech, generateStoryboard } from "@/lib/ai";

const productionSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(5),
  includeText: z.boolean().optional().default(true),
  includeImage: z.boolean().optional().default(true),
  includeAudio: z.boolean().optional().default(true),
  includeVideo: z.boolean().optional().default(true),
  audioVoice: z.string().optional(),
  audioModel: z.string().optional(),
  videoFrames: z.number().min(3).max(12).optional(),
  videoDuration: z.number().min(15).max(240).optional(),
  imageSize: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional(),
  imageModel: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const params = productionSchema.parse(body);

    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return notFound("Project not found");
    }

    const productionRunId = nanoid();
    const plan = await generateProductionPlan(params.prompt);

    const assets: Record<string, any> = {};
    const errors: Record<string, string> = {};

    if (params.includeText) {
      try {
          assets.text = await prisma.asset.create({
            data: {
              projectId: project.id,
              type: "TEXT",
              title: plan.title || `Production Brief - ${new Date().toLocaleString()}`,
              inputPrompt: params.prompt,
              outputData: {
                title: plan.title,
                summary: plan.summary,
                script: plan.script,
                audioNarration: plan.audioNarration,
                visualPrompt: plan.visualPrompt,
                videoConcept: plan.videoConcept,
                callToAction: plan.callToAction,
                keywords: plan.keywords,
              },
              metadata: {
                mode: "production",
                productionRunId,
                source: "plan",
                userPrompt: params.prompt,
              },
            },
          });
      } catch (error) {
        console.error("Failed to persist text asset:", error);
        errors.text = "Failed to save text asset";
      }
    }

    const asyncTasks: Promise<void>[] = [];

    if (params.includeImage) {
      asyncTasks.push(
        (async () => {
          try {
            const size = params.imageSize ?? "1024x1024";
            const [width, height] = size.split("x").map(Number);
            const imageResult = await generateImage({
              prompt:
                plan.visualPrompt ||
                `Cinematic concept art for: ${plan.summary}`,
              width,
              height,
              model: params.imageModel ?? "dall-e-3",
            });

            assets.image = await prisma.asset.create({
              data: {
                projectId: project.id,
                type: "IMAGE",
                title: `${plan.title} - Key Art`,
                inputPrompt: plan.visualPrompt || plan.summary,
                outputData: {
                  url: imageResult.url,
                  revisedPrompt: imageResult.revisedPrompt,
                  model: imageResult.model,
                },
                metadata: {
                  mode: "production",
                  productionRunId,
                  size,
                  visualPrompt: plan.visualPrompt,
                  userPrompt: params.prompt,
                },
              },
            });
          } catch (error) {
            console.error("Failed to generate image:", error);
            errors.image =
              error instanceof Error ? error.message : "Image generation failed";
          }
        })()
      );
    }

    if (params.includeAudio) {
      asyncTasks.push(
        (async () => {
          try {
            const narration =
              plan.audioNarration || plan.script || plan.summary;
            const audioResult = await generateSpeech({
              text: narration,
              voice: params.audioVoice ?? "alloy",
              model: params.audioModel ?? "tts-1",
            });

            assets.audio = await prisma.asset.create({
              data: {
                projectId: project.id,
                type: "AUDIO",
                title: `${plan.title} - Voiceover`,
                inputPrompt: narration,
                outputData: {
                  dataUrl: audioResult.dataUrl,
                  url: audioResult.url,
                  duration: audioResult.duration,
                  format: audioResult.format,
                  model: audioResult.model,
                },
                  metadata: {
                    mode: "production",
                    productionRunId,
                    voice: params.audioVoice ?? "alloy",
                    narrationSource: plan.audioNarration,
                    userPrompt: params.prompt,
                  },
              },
            });
          } catch (error) {
            console.error("Failed to generate audio:", error);
            errors.audio =
              error instanceof Error ? error.message : "Audio generation failed";
          }
        })()
      );
    }

    if (params.includeVideo) {
      asyncTasks.push(
        (async () => {
          try {
            const storyboard = await generateStoryboard({
              concept: plan.videoConcept || plan.summary,
              numberOfFrames: params.videoFrames ?? 6,
              duration: params.videoDuration ?? 60,
            });

            assets.video = await prisma.asset.create({
              data: {
                projectId: project.id,
                type: "VIDEO",
                title: `${plan.title} - Storyboard`,
                inputPrompt: plan.videoConcept || plan.summary,
                outputData: storyboard as unknown as Prisma.JsonObject,
                  metadata: {
                    mode: "production",
                    productionRunId,
                    frames: params.videoFrames ?? 6,
                    duration: params.videoDuration ?? 60,
                    concept: plan.videoConcept || plan.summary,
                    userPrompt: params.prompt,
                  },
              },
            });
          } catch (error) {
            console.error("Failed to generate video storyboard:", error);
            errors.video =
              error instanceof Error
                ? error.message
                : "Video storyboard generation failed";
          }
        })()
      );
    }

    await Promise.all(asyncTasks);

    return NextResponse.json({
      runId: productionRunId,
      plan,
      assets,
      errors,
    });
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
    console.error("Production generation error:", error);
    return serverError();
  }
}
