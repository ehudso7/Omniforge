import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/auth-helpers";

// GET /api/projects/[projectId]/assets/[assetId] - Get a single asset
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  try {
    const { projectId, assetId } = await params;
    const user = await requireAuth();

    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        projectId,
        project: {
          userId: user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!asset) {
      return notFound("Asset not found");
    }

    return NextResponse.json({ asset });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    console.error("Error fetching asset:", error);
    return serverError();
  }
}

// DELETE /api/projects/[projectId]/assets/[assetId] - Delete an asset
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  try {
    const { projectId, assetId } = await params;
    const user = await requireAuth();

    // Verify ownership
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        projectId,
        project: {
          userId: user.id,
        },
      },
    });

    if (!asset) {
      return notFound("Asset not found");
    }

    await prisma.asset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    console.error("Error deleting asset:", error);
    return serverError();
  }
}
