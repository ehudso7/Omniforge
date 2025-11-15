import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { generateUnifiedProduction } from "@/lib/ai/unified-generator";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";

const unifiedGenerationSchema = z.object({
  prompt: z.string().min(1).max(5000),
  projectId: z.string().min(1),
  options: z
    .object({
      includeText: z.boolean().optional(),
      includeImages: z.boolean().optional(),
      includeAudio: z.boolean().optional(),
      includeVideo: z.boolean().optional(),
      autoDetect: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { prompt, projectId, options } = unifiedGenerationSchema.parse(body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Generate unified production output
    const result = await generateUnifiedProduction({
      prompt,
      projectId,
      options,
    });

    // Save all generated assets to the database
    const savedAssets = [];

    // Save text asset
    if (result.outputs.text) {
      const textAsset = await prisma.asset.create({
        data: {
          projectId,
          type: "TEXT",
          title: result.outputs.text.title,
          inputPrompt: prompt,
          outputData: {
            content: result.outputs.text.content,
            model: result.outputs.text.model,
          },
          metadata: {
            generatedAt: result.generatedAt.toISOString(),
            generationTime: result.metadata.generationTime,
          },
        },
      });
      savedAssets.push(textAsset);
    }

    // Save image assets
    if (result.outputs.images && result.outputs.images.length > 0) {
      for (const image of result.outputs.images) {
        const imageAsset = await prisma.asset.create({
          data: {
            projectId,
            type: "IMAGE",
            title: image.title,
            inputPrompt: prompt,
            outputData: {
              url: image.url,
              description: image.description,
              model: image.model,
            },
            metadata: {
              generatedAt: result.generatedAt.toISOString(),
            },
          },
        });
        savedAssets.push(imageAsset);
      }
    }

    // Save audio asset
    if (result.outputs.audio) {
      const audioAsset = await prisma.asset.create({
        data: {
          projectId,
          type: "AUDIO",
          title: result.outputs.audio.title,
          inputPrompt: prompt,
          outputData: {
            url: result.outputs.audio.url,
            duration: result.outputs.audio.duration,
            model: result.outputs.audio.model,
          },
          metadata: {
            generatedAt: result.generatedAt.toISOString(),
          },
        },
      });
      savedAssets.push(audioAsset);
    }

    // Save video asset
    if (result.outputs.video) {
      const videoAsset = await prisma.asset.create({
        data: {
          projectId,
          type: "VIDEO",
          title: result.outputs.video.title,
          inputPrompt: prompt,
          outputData: {
            storyboard: result.outputs.video.storyboard,
          },
          metadata: {
            generatedAt: result.generatedAt.toISOString(),
          },
        },
      });
      savedAssets.push(videoAsset);
    }

    // Save manga production as a complete production asset
    if (result.outputs.manga) {
      const mangaAsset = await prisma.asset.create({
        data: {
          projectId,
          type: "TEXT", // Store as TEXT type but with complete manga data
          title: result.outputs.manga.title,
          inputPrompt: prompt,
          outputData: {
            type: "manga",
            title: result.outputs.manga.title,
            synopsis: result.outputs.manga.synopsis,
            coverImage: result.outputs.manga.coverImage,
            characters: result.outputs.manga.characters,
            pages: result.outputs.manga.pages,
            totalPages: result.outputs.manga.totalPages,
          },
          metadata: {
            productionType: "manga",
            generatedAt: result.generatedAt.toISOString(),
            generationTime: result.metadata.generationTime,
          },
        },
      });
      savedAssets.push(mangaAsset);

      // Also save individual page images for easy access
      for (const page of result.outputs.manga.pages) {
        for (const panel of page.panels) {
          const panelAsset = await prisma.asset.create({
            data: {
              projectId,
              type: "IMAGE",
              title: `${result.outputs.manga.title} - Page ${page.pageNumber} Panel ${panel.description.substring(0, 50)}`,
              inputPrompt: prompt,
              outputData: {
                url: panel.imageUrl,
                description: panel.description,
                dialogue: panel.dialogue,
                narration: panel.narration,
                mangaTitle: result.outputs.manga.title,
                pageNumber: page.pageNumber,
                panelNumber: panel.description,
              },
              metadata: {
                mangaProduction: true,
                pageNumber: page.pageNumber,
                generatedAt: result.generatedAt.toISOString(),
              },
            },
          });
          savedAssets.push(panelAsset);
        }
      }
    }

    return NextResponse.json({
      result,
      assets: savedAssets,
      message: "Production generated successfully",
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
    console.error("Unified generation error:", error);
    return serverError(
      error instanceof Error ? error.message : "Generation failed"
    );
  }
}
