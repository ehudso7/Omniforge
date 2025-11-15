import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/auth-helpers";
import { z } from "zod";

const createAssetSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "AUDIO", "VIDEO"]),
  title: z.string().min(1).max(200),
  inputPrompt: z.string(),
  outputData: z.any(),
  metadata: z.any().optional(),
});

// GET /api/projects/[projectId]/assets - List all assets for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const user = await requireAuth();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return notFound("Project not found");
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const assets = await prisma.asset.findMany({
      where: {
        projectId,
        ...(type && { type: type as "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" }),
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON strings back to objects for SQLite
    const parsedAssets = assets.map((asset: any) => ({
      ...asset,
      outputData: JSON.parse(asset.outputData),
      metadata: asset.metadata ? JSON.parse(asset.metadata) : null,
    }));

    return NextResponse.json({ assets: parsedAssets });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    console.error("Error fetching assets:", error);
    return serverError();
  }
}

// POST /api/projects/[projectId]/assets - Create a new asset
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const user = await requireAuth();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return notFound("Project not found");
    }

    const body = await request.json();
    const data = createAssetSchema.parse(body);

    // Stringify JSON for SQLite storage
    const asset = await prisma.asset.create({
      data: {
        type: data.type,
        title: data.title,
        inputPrompt: data.inputPrompt,
        outputData: JSON.stringify(data.outputData),
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        projectId,
      },
    });

    // Parse back to return to client
    const parsedAsset = {
      ...asset,
      outputData: JSON.parse(asset.outputData),
      metadata: asset.metadata ? JSON.parse(asset.metadata) : null,
    };

    return NextResponse.json({ asset: parsedAsset }, { status: 201 });
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
    console.error("Error creating asset:", error);
    return serverError();
  }
}
