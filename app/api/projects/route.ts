import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, serverError } from "@/lib/auth-helpers";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// GET /api/projects - List all projects for the current user
export async function GET() {
  try {
    const user = await requireAuth();

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    console.error("Error fetching projects:", error);
    return serverError();
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description } = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
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
    console.error("Error creating project:", error);
    return serverError();
  }
}
