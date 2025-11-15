import { NextResponse } from "next/server";
import { requireAuth, unauthorized, notFound } from "@/lib/auth-helpers";

/**
 * Serve generated files
 * In production, this would stream from S3/Cloudinary/etc
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ key: string }> }
) {
  try {
    await requireAuth();
    const { key } = await context.params;

    // In production, this would:
    // 1. Fetch file from storage (S3, Cloudinary, etc.)
    // 2. Stream file to client
    // 3. Set appropriate headers

    // For now, return 404 (files would be served from storage)
    return notFound("File not found");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    return notFound();
  }
}
