import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth-helpers";
import { getProgressTracker } from "@/lib/progress-tracker";

/**
 * Get generation progress
 * Used for long-running generations (manga, video) to show progress
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ generationId: string }> }
) {
  try {
    await requireAuth();
    const { generationId } = await context.params;

    const tracker = getProgressTracker(generationId);
    const progress = tracker.getProgress();

    return NextResponse.json({ progress });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 }
    );
  }
}
