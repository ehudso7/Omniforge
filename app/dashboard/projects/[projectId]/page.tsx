import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import ProjectWorkspace from "@/components/dashboard/project-workspace";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  let session;

  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Session error:", error);
    redirect("/auth/signin");
  }

  if (!session) {
    redirect("/auth/signin");
  }

  let project;

  try {
    project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        assets: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    notFound();
  }

  if (!project) {
    notFound();
  }

  return <ProjectWorkspace project={project} />;
}
