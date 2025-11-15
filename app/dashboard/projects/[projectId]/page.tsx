import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import ProductionViewer from "@/components/studio/production-viewer";
import ProjectWorkspace from "@/components/dashboard/project-workspace";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

  // Check if this is an orchestrated production
  const isOrchestrated = project.assets.some(
    (asset: any) => asset.metadata?.orchestrated === true
  );

  // Use the new Production Viewer for orchestrated projects
  // Fall back to old ProjectWorkspace for manually created projects
  if (isOrchestrated) {
    return <ProductionViewer project={project} />;
  }

  return <ProjectWorkspace project={project} />;
}
