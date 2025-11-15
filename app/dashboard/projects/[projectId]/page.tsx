import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import ProjectWorkspace from "@/components/dashboard/project-workspace";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const project = await prisma.project.findFirst({
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

  if (!project) {
    notFound();
  }

  // Parse JSON strings back to objects for SQLite
  const parsedProject = {
    ...project,
    assets: project.assets.map((asset: any) => ({
      ...asset,
      outputData: JSON.parse(asset.outputData),
      metadata: asset.metadata ? JSON.parse(asset.metadata) : null,
    })),
  };

  return <ProjectWorkspace project={parsedProject} />;
}
