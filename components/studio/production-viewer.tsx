"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, Music, Video, Download, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";

interface Asset {
  id: string;
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";
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

interface ProductionViewerProps {
  project: Project;
}

export default function ProductionViewer({ project }: ProductionViewerProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Check if this is an orchestrated production
  const isOrchestrated = project.assets.some(
    (asset) => asset.metadata?.orchestrated === true
  );

  // Group assets by type
  const assetsByType = {
    TEXT: project.assets.filter((a) => a.type === "TEXT"),
    IMAGE: project.assets.filter((a) => a.type === "IMAGE"),
    AUDIO: project.assets.filter((a) => a.type === "AUDIO"),
    VIDEO: project.assets.filter((a) => a.type === "VIDEO"),
  };

  const hasMultipleTypes = Object.values(assetsByType).filter((arr) => arr.length > 0).length > 1;

  const exportMarkdown = () => {
    let markdown = `# ${project.name}\n\n`;
    if (project.description) {
      markdown += `${project.description}\n\n`;
    }
    markdown += `---\n\n`;

    assetsByType.TEXT.forEach((asset) => {
      markdown += `## ${asset.title}\n\n${asset.outputData.content}\n\n---\n\n`;
    });

    assetsByType.IMAGE.forEach((asset) => {
      markdown += `## ${asset.title}\n\n![${asset.title}](${asset.outputData.url})\n\n`;
      if (asset.outputData.revisedPrompt) {
        markdown += `*${asset.outputData.revisedPrompt}*\n\n`;
      }
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isOrchestrated && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-medium mb-2">
                  <Sparkles className="w-3 h-3" />
                  Orchestrated Production
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {project.description}
                </p>
              )}
            </div>
            <button
              onClick={exportMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Asset Summary */}
          {hasMultipleTypes && (
            <div className="mt-6 flex flex-wrap gap-3">
              {Object.entries(assetsByType).map(([type, assets]) => {
                if (assets.length === 0) return null;
                const icons = {
                  TEXT: FileText,
                  IMAGE: ImageIcon,
                  AUDIO: Music,
                  VIDEO: Video,
                };
                const Icon = icons[type as keyof typeof icons];
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {assets.length} {type.toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Production Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {project.assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => setSelectedAsset(asset)}
            />
          ))}
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}

function AssetCard({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  const icons = {
    TEXT: FileText,
    IMAGE: ImageIcon,
    AUDIO: Music,
    VIDEO: Video,
  };
  const Icon = icons[asset.type];

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group shadow-sm hover:shadow-lg"
    >
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {asset.type}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-2 line-clamp-2">
          {asset.title}
        </h3>
      </div>

      <div className="p-4">
        {asset.type === "TEXT" && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
            {asset.outputData.content}
          </p>
        )}
        {asset.type === "IMAGE" && asset.outputData.url && (
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={asset.outputData.url}
              alt={asset.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        {asset.type === "AUDIO" && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {asset.outputData.script || "Audio narration"}
          </p>
        )}
        {asset.type === "VIDEO" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Video storyboard with {asset.outputData.frames?.length || 0} frames
          </p>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(asset.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function AssetDetailModal({
  asset,
  onClose,
}: {
  asset: Asset;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {asset.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {asset.type} • Created {new Date(asset.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="p-6">
          {asset.type === "TEXT" && (
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                {asset.outputData.content}
              </pre>
            </div>
          )}

          {asset.type === "IMAGE" && asset.outputData.url && (
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={asset.outputData.url}
                  alt={asset.title}
                  fill
                  className="object-contain"
                />
              </div>
              {asset.outputData.revisedPrompt && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {asset.outputData.revisedPrompt}
                </p>
              )}
            </div>
          )}

          {asset.type === "AUDIO" && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {asset.outputData.script}
                </p>
              </div>
              {asset.outputData.url && (
                <audio controls className="w-full">
                  <source src={asset.outputData.url} />
                </audio>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
