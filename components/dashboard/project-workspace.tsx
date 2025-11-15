"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, FileText, Image, Music, Video } from "lucide-react";
import UnifiedGenerator from "@/components/tools/unified-generator";
import TextTool from "@/components/tools/text-tool";
import ImageTool from "@/components/tools/image-tool";
import AudioTool from "@/components/tools/audio-tool";
import VideoTool from "@/components/tools/video-tool";

interface Asset {
  id: string;
  type: string;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  assets: Asset[];
}

interface ProjectWorkspaceProps {
  project: Project;
}

type ViewType = "UNIFIED" | "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";

export default function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [activeView, setActiveView] = useState<ViewType>("UNIFIED");
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const views = [
    { type: "UNIFIED" as ViewType, label: "Unified Generator", icon: Sparkles, primary: true },
    { type: "TEXT" as ViewType, label: "Text Only", icon: FileText },
    { type: "IMAGE" as ViewType, label: "Image Only", icon: Image },
    { type: "AUDIO" as ViewType, label: "Audio Only", icon: Music },
    { type: "VIDEO" as ViewType, label: "Video Only", icon: Video },
  ];

  const handleGenerationComplete = () => {
    // Refresh the page to show new assets
    setRefreshKey((prev) => prev + 1);
    router.refresh();
  };

  const renderView = () => {
    const assets = project.assets.filter((a) => {
      if (activeView === "UNIFIED") return true;
      return a.type === activeView;
    });

    switch (activeView) {
      case "UNIFIED":
        return (
          <UnifiedGenerator
            key={refreshKey}
            projectId={project.id}
            assets={assets}
            onGenerationComplete={handleGenerationComplete}
          />
        );
      case "TEXT":
        return <TextTool projectId={project.id} assets={assets.filter((a) => a.type === "TEXT")} />;
      case "IMAGE":
        return <ImageTool projectId={project.id} assets={assets.filter((a) => a.type === "IMAGE")} />;
      case "AUDIO":
        return <AudioTool projectId={project.id} assets={assets.filter((a) => a.type === "AUDIO")} />;
      case "VIDEO":
        return <VideoTool projectId={project.id} assets={assets.filter((a) => a.type === "VIDEO")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>

          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {project.description}
            </p>
          )}
        </div>

        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.type}
                  onClick={() => setActiveView(view.type)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                    activeView === view.type
                      ? view.primary
                        ? "bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 text-blue-600"
                        : "bg-gray-50 dark:bg-gray-900 border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">{renderView()}</div>
    </div>
  );
}
