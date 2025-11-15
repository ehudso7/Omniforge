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
  const [viewMode, setViewMode] = useState<"grid" | "organized">("organized");

  // Check if this is an orchestrated production
  const isOrchestrated = project.assets.some(
    (asset) => asset.metadata?.orchestrated === true
  );

  // Get production type from metadata
  const productionType = project.assets[0]?.metadata?.productionType || "general";
  const isComplete = project.assets.length >= 6; // Minimum for complete production

  // Organize assets by component type (for manga, etc.)
  const organizedAssets = {
    story: project.assets.filter((a) => 
      a.title.includes("Story") || a.title.includes("Script") || a.title.includes("Curriculum")
    ),
    characters: project.assets.filter((a) => 
      a.title.includes("Character") && a.type === "TEXT"
    ),
    worldBuilding: project.assets.filter((a) => 
      a.title.includes("World") || a.title.includes("Setting")
    ),
    coverArt: project.assets.filter((a) => 
      a.title.includes("Cover") && a.type === "IMAGE"
    ),
    characterDesigns: project.assets.filter((a) => 
      a.title.includes("Character") && a.type === "IMAGE"
    ),
    scenes: project.assets.filter((a) => 
      (a.title.includes("Scene") || a.title.includes("Key Frame")) && a.type === "IMAGE"
    ),
    other: project.assets.filter((a) => {
      const title = a.title.toLowerCase();
      return !title.includes("story") && !title.includes("character") && 
             !title.includes("world") && !title.includes("cover") && 
             !title.includes("scene") && !title.includes("frame");
    }),
  };

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
              <div className="flex items-center gap-3 mb-2">
                {isOrchestrated && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Complete {productionType.replace("-", " ")} Production
                  </div>
                )}
                {isComplete && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-300 text-xs font-medium">
                    ✓ Production Ready
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "organized" : "grid")}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
              >
                {viewMode === "grid" ? "Organized View" : "Grid View"}
              </button>
              <button
                onClick={exportMarkdown}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Asset Summary */}
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
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
                >
                  <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {assets.length} {type.toLowerCase()}{assets.length > 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Production Content */}
      <div className="container mx-auto px-4 py-8">
        {viewMode === "organized" && isOrchestrated ? (
          /* Organized view by component type */
          <div className="space-y-8">
            {/* Cover Art */}
            {organizedAssets.coverArt.length > 0 && (
              <Section title="Cover Art" icon={ImageIcon}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {organizedAssets.coverArt.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} featured />
                  ))}
                </div>
              </Section>
            )}

            {/* Story/Script */}
            {organizedAssets.story.length > 0 && (
              <Section title="Complete Story" icon={FileText} description="Full narrative ready to read">
                {organizedAssets.story.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                ))}
              </Section>
            )}

            {/* Character Designs */}
            {organizedAssets.characterDesigns.length > 0 && (
              <Section title="Character Designs" icon={ImageIcon}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {organizedAssets.characterDesigns.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                  ))}
                </div>
              </Section>
            )}

            {/* Character Profiles */}
            {organizedAssets.characters.length > 0 && (
              <Section title="Character Profiles" icon={FileText}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizedAssets.characters.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} compact />
                  ))}
                </div>
              </Section>
            )}

            {/* Scene Illustrations */}
            {organizedAssets.scenes.length > 0 && (
              <Section title="Key Scenes" icon={ImageIcon}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {organizedAssets.scenes.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                  ))}
                </div>
              </Section>
            )}

            {/* World Building */}
            {organizedAssets.worldBuilding.length > 0 && (
              <Section title="World & Setting" icon={FileText}>
                {organizedAssets.worldBuilding.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                ))}
              </Section>
            )}

            {/* Other Assets */}
            {organizedAssets.other.length > 0 && (
              <Section title="Additional Assets" icon={FileText}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizedAssets.other.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {project.assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={() => setSelectedAsset(asset)}
              />
            ))}
          </div>
        )}
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

function Section({ 
  title, 
  icon: Icon, 
  description, 
  children 
}: { 
  title: string; 
  icon: any; 
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function AssetCard({ 
  asset, 
  onClick,
  featured = false,
  compact = false 
}: { 
  asset: Asset; 
  onClick: () => void;
  featured?: boolean;
  compact?: boolean;
}) {
  const icons = {
    TEXT: FileText,
    IMAGE: ImageIcon,
    AUDIO: Music,
    VIDEO: Video,
  };
  const Icon = icons[asset.type];

  const content = asset.outputData?.text || asset.outputData?.content || asset.outputData?.script || "";

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group shadow-sm hover:shadow-lg ${featured ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <div className={`p-4 border-b border-gray-100 dark:border-gray-700 ${compact ? 'pb-2' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {asset.type}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
        </div>
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mt-2 ${compact ? 'text-sm line-clamp-1' : 'line-clamp-2'}`}>
          {asset.title}
        </h3>
      </div>

      <div className={`p-4 ${compact ? 'py-2' : ''}`}>
        {asset.type === "TEXT" && (
          <p className={`text-sm text-gray-600 dark:text-gray-400 ${compact ? 'line-clamp-2' : 'line-clamp-4'}`}>
            {content}
          </p>
        )}
        {asset.type === "IMAGE" && asset.outputData.url && (
          <div className={`relative ${featured ? 'aspect-video' : 'aspect-square'} rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700`}>
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
            {content || "Audio narration"}
          </p>
        )}
        {asset.type === "VIDEO" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Video storyboard with {asset.outputData.frames?.length || 0} frames
          </p>
        )}
      </div>

      {!compact && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(asset.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
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
  const content = asset.outputData?.text || asset.outputData?.content || asset.outputData?.script || "";

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
          {asset.metadata?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {asset.metadata.description}
            </p>
          )}
        </div>

        <div className="p-6 max-h-[60vh] overflow-auto">
          {asset.type === "TEXT" && (
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                {content}
              </div>
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
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">
                    AI Generation Details
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {asset.outputData.revisedPrompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {asset.type === "AUDIO" && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {content}
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

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {asset.metadata?.component && `Part of: ${asset.metadata.component}`}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
