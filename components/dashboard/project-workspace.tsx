import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Layers,
} from "lucide-react";
import OmniTool from "@/components/tools/omni-tool";

interface Asset {
  id: string;
  type: string;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: string | Date;
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

const assetSections = [
  {
    type: "TEXT",
    label: "Narratives",
    description: "Long-form scripts, treatments, and copy",
    icon: FileText,
  },
  {
    type: "IMAGE",
    label: "Key Art",
    description: "Visual identity, posters, and hero imagery",
    icon: ImageIcon,
  },
  {
    type: "AUDIO",
    label: "Voice & Audio",
    description: "Narrated voiceovers and sonic guides",
    icon: Music,
  },
  {
    type: "VIDEO",
    label: "Storyboards",
    description: "Frame-by-frame beats and scripts",
    icon: Video,
  },
] as const;

export default function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const groupedAssets = assetSections.reduce<Record<string, Asset[]>>(
    (acc, section) => {
      acc[section.type] = project.assets.filter(
        (asset) => asset.type === section.type
      );
      return acc;
    },
    {}
  );

  const totalAssets = project.assets.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OmniTool projectId={project.id} />
          </div>
          <div className="card space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">
                Project Snapshot
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <p className="text-lg font-semibold">{project.name}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalAssets} total assets
              </p>
            </div>
            <div className="space-y-2">
              {assetSections.map((section) => (
                <div
                  key={section.type}
                  className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <section.icon className="w-4 h-4" />
                    {section.label}
                  </div>
                  <span className="text-lg font-semibold">
                    {groupedAssets[section.type]?.length || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Asset Library</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Latest outputs from each production channel.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {assetSections.map((section) => {
              const assets = groupedAssets[section.type] || [];
              const Icon = section.icon;

              return (
                <div key={section.type} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        <Icon className="w-4 h-4" />
                        {section.label}
                      </div>
                      <p className="text-xs text-gray-500">
                        {section.description}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {assets.length} total
                    </span>
                  </div>

                  {assets.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Nothing here yet. Run the Omni engine to generate this
                      modality.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {assets.slice(0, 3).map((asset) => (
                        <div
                          key={asset.id}
                          className="border border-gray-100 dark:border-gray-700 rounded-md p-3 space-y-2 bg-gray-50 dark:bg-gray-900/40"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{asset.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(asset.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {asset.type === "TEXT" && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">
                              {asset.outputData?.content}
                            </p>
                          )}
                          {asset.type === "IMAGE" && asset.outputData?.url && (
                            <div className="relative w-full h-40 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Image
                                src={asset.outputData.url}
                                alt={asset.title}
                                fill
                                sizes="100vw"
                                className="object-cover"
                              />
                            </div>
                          )}
                          {asset.type === "AUDIO" && asset.outputData?.url && (
                            <audio
                              controls
                              className="w-full"
                              src={asset.outputData.url}
                            >
                              Your browser does not support audio playback.
                            </audio>
                          )}
                          {asset.type === "VIDEO" &&
                            asset.outputData?.frames && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <p className="font-semibold">Script excerpt</p>
                                <p className="line-clamp-3 whitespace-pre-wrap">
                                  {asset.outputData?.script}
                                </p>
                                <p className="text-[10px] uppercase tracking-wide">
                                  {asset.outputData.frames.length} frames ·{" "}
                                  {asset.outputData.totalDuration}s
                                </p>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
