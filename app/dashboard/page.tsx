import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProjectList from "@/components/dashboard/project-list";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { assets: true },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Your Projects</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your creative projects and AI-generated content
        </p>
      </div>

      <ProjectList initialProjects={projects} />
    </div>
  );
}
