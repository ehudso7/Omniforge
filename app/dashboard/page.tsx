import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OmniForgeStudio from "@/components/studio/omniforge-studio";
import ProjectList from "@/components/dashboard/project-list";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

  // If no projects, show the Suno-style studio interface
  if (projects.length === 0) {
    return <OmniForgeStudio />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Your Productions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your AI-generated content projects
          </p>
        </div>

        {/* Quick Create Button */}
        <div className="mb-8">
          <a
            href="/studio"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            ✨ Create New Production
          </a>
        </div>

        <ProjectList initialProjects={projects} />
      </div>
    </div>
  );
}
