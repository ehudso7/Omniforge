"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Image, Music, Video, Sparkles } from "lucide-react";
import UnifiedCreator from "@/components/tools/unified-creator";
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

type ToolType = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";

export default function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ToolType | "CREATE">("CREATE");

  const tabs = [
    { type: "CREATE" as const, label: "Create", icon: Sparkles },
    { type: "TEXT" as ToolType, label: "Text", icon: FileText },
    { type: "IMAGE" as ToolType, label: "Image", icon: Image },
    { type: "AUDIO" as ToolType, label: "Audio", icon: Music },
    { type: "VIDEO" as ToolType, label: "Video", icon: Video },
  ];

  const renderTool = () => {
    if (activeTab === "CREATE") {
      return <UnifiedCreator projectId={project.id} />;
    }

    const assets = project.assets.filter((a) => a.type === activeTab);

    switch (activeTab) {
      case "TEXT":
        return <TextTool projectId={project.id} assets={assets} />;
      case "IMAGE":
        return <ImageTool projectId={project.id} assets={assets} />;
      case "AUDIO":
        return <AudioTool projectId={project.id} assets={assets} />;
      case "VIDEO":
        return <VideoTool projectId={project.id} assets={assets} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                    activeTab === tab.type
                      ? "bg-gray-50 dark:bg-gray-900 border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">{renderTool()}</div>
    </div>
  );
}
