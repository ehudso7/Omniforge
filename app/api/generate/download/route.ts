import { NextResponse } from "next/server";
import { requireAuth, unauthorized, notFound, serverError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * Download endpoint for generated content
 * Provides downloadable files for manga (PDF), audio (MP3), video (MP4)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string; format?: string }> }
) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");
    const format = searchParams.get("format") || "default";

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
    }

    // Get asset and verify ownership
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
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

    // Handle different asset types
    switch (asset.type) {
      case "TEXT":
        // Manga downloads
        if (asset.outputData.compiled) {
          const compiled = asset.outputData.compiled;
          
          if (format === "pdf" && compiled.pdfUrl) {
            return NextResponse.redirect(compiled.pdfUrl);
          }
          if (format === "images" && compiled.imageSequenceUrl) {
            return NextResponse.redirect(compiled.imageSequenceUrl);
          }
          if (format === "webtoon" && compiled.webtoonUrl) {
            return NextResponse.redirect(compiled.webtoonUrl);
          }
        }
        
        // Fallback: Return JSON for manga structure
        return NextResponse.json(asset.outputData, {
          headers: {
            "Content-Disposition": `attachment; filename="${asset.title}.json"`,
          },
        });

      case "AUDIO":
        // Audio file download
        if (asset.outputData.url) {
          // In production, fetch the actual audio file and stream it
          // For now, redirect to the URL
          return NextResponse.redirect(asset.outputData.url);
        }
        return notFound("Audio file not available");

      case "VIDEO":
        // Video file download
        if (asset.outputData.url) {
          // In production, fetch the actual video file and stream it
          return NextResponse.redirect(asset.outputData.url);
        }
        return notFound("Video file not available");

      case "IMAGE":
        // Image download
        if (asset.outputData.url) {
          return NextResponse.redirect(asset.outputData.url);
        }
        return notFound("Image not available");

      default:
        return serverError("Unsupported asset type");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    console.error("Download error:", error);
    return serverError();
  }
}
