import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProjectList from "@/components/dashboard/project-list";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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

  let projects: any[] = [];

  try {
    projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    // Continue with empty projects array
  }

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
