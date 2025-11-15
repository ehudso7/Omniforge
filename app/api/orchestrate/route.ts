import { NextResponse } from "next/server";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { checkRateLimit, rateLimitConfig } from "@/lib/rate-limit";
import { orchestrateProduction } from "@/lib/orchestration/production-orchestrator";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const orchestrateSchema = z.object({
  prompt: z.string().min(10).max(1000),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Rate limiting check
    const rateLimitResult = checkRateLimit(user.id, rateLimitConfig.generation);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: new Date(rateLimitResult.reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { prompt, projectId, projectName } = orchestrateSchema.parse(body);

    // Orchestrate the production
    const production = await orchestrateProduction(prompt);

    // Create or use existing project
    let project;
    if (projectId) {
      // Verify ownership
      project = await prisma.project.findFirst({
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
    } else {
      // Create new project
      project = await prisma.project.create({
        data: {
          name: projectName || production.projectTitle,
          description: production.summary,
          userId: user.id,
        },
      });
    }

    // Save all generated assets to the project
    const savedAssets = await Promise.all(
      production.assets.map((asset) =>
        prisma.asset.create({
          data: {
            projectId: project.id,
            type: asset.type,
            title: asset.title,
            inputPrompt: asset.prompt,
            outputData: asset.content,
            metadata: {
              ...asset.metadata,
              analysis: production.analysis,
              orchestrated: true,
              completedAt: production.completedAt,
            },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
      production: {
        ...production,
        assets: savedAssets,
      },
      message: production.isComplete 
        ? `Complete ${production.productionType} production created!`
        : `Production created (${savedAssets.length} assets)`,
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
    console.error("Orchestration error:", error);
    return serverError(
      error instanceof Error ? error.message : "Production orchestration failed"
    );
  }
}
