"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Loader2, CheckCircle, Image as ImageIcon, FileText, Music, Video, Download } from "lucide-react";

interface Asset {
  id: string;
  type: string;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: Date;
}

interface UnifiedGeneratorProps {
  projectId: string;
  assets: Asset[];
  onGenerationComplete?: () => void;
}

interface GenerationResult {
  text?: {
    content: string;
    title: string;
  };
  images?: Array<{
    url: string;
    title: string;
    description: string;
  }>;
  audio?: {
    url: string;
    title: string;
    duration: number;
  };
  video?: {
    storyboard: {
      script: string;
      frames: Array<{
        title: string;
        description: string;
        duration: number;
      }>;
    };
    title: string;
  };
  manga?: {
    title: string;
    synopsis: string;
    coverImage?: string;
    characters: Array<{
      name: string;
      description: string;
      designUrl?: string;
    }>;
    pages: Array<{
      pageNumber: number;
      layout: "single" | "double" | "triple" | "quad";
      panels: Array<{
        imageUrl: string;
        description: string;
        dialogue?: string;
        narration?: string;
      }>;
    }>;
    totalPages: number;
  };
}

export default function UnifiedGenerator({
  projectId,
  assets,
  onGenerationComplete,
}: UnifiedGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setGenerationProgress("Analyzing your prompt...");

    try {
      const response = await fetch("/api/generate/unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          projectId,
          options: {
            autoDetect: true, // Let AI decide what to generate
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await response.json();
      setGenerationProgress("Finalizing production...");
      
      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setResult(data.result.outputs);
      setPrompt(""); // Clear prompt after successful generation
      
      if (onGenerationComplete) {
        onGenerationComplete();
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Generation Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Unified Production Generator</h2>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter a single prompt and get complete, production-ready content across all modalities. 
          The AI will automatically determine what to generate (text, images, audio, video).
        </p>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: 'Create a manga about a robot learning to paint' or 'Create a complete story with illustrations'"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            rows={4}
            disabled={isGenerating}
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {generationProgress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-blue-800 dark:text-blue-200">{generationProgress}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Production...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Complete Production
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Text Output */}
          {result.text && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold">{result.text.title}</h3>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {result.text.content}
                </div>
              </div>
            </div>
          )}

          {/* Images Output */}
          {result.images && result.images.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold">Generated Images</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.description || `Generated image ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => handleDownload(image.url, `image-${index + 1}.png`)}
                          className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 transition-opacity"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {image.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Output */}
          {result.audio && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold">{result.audio.title}</h3>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Duration: {result.audio.duration}s
                </p>
                <audio controls className="w-full">
                  <source src={result.audio.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}

          {/* Video Storyboard Output */}
          {result.video && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold">{result.video.title}</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Script</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {result.video.storyboard.script}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Storyboard Frames</h4>
                  <div className="space-y-3">
                    {result.video.storyboard.frames.map((frame, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{frame.title}</h5>
                          <span className="text-sm text-gray-500">
                            {frame.duration}s
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {frame.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complete Manga Production */}
          {result.manga && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">{result.manga.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{result.manga.synopsis}</p>
                
                {/* Cover Image */}
                {result.manga.coverImage && (
                  <div className="mb-6">
                    <div className="relative w-full max-w-md mx-auto aspect-[2/3] rounded-lg overflow-hidden">
                      <Image
                        src={result.manga.coverImage}
                        alt={`${result.manga.title} cover`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Characters */}
                {result.manga.characters && result.manga.characters.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Characters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.manga.characters.map((character, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          {character.designUrl && (
                            <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden">
                              <Image
                                src={character.designUrl}
                                alt={character.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <h4 className="font-semibold mb-1">{character.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{character.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Manga Pages */}
              <div>
                <h3 className="text-2xl font-semibold mb-4">
                  Complete Manga ({result.manga.totalPages} pages)
                </h3>
                <div className="space-y-8">
                  {result.manga.pages.map((page, pageIndex) => (
                    <div key={pageIndex} className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Page {page.pageNumber}</h4>
                        <span className="text-sm text-gray-500">Layout: {page.layout}</span>
                      </div>
                      
                      {/* Panels Grid */}
                      <div className={`grid gap-4 ${
                        page.layout === "single" ? "grid-cols-1" :
                        page.layout === "double" ? "grid-cols-2" :
                        page.layout === "triple" ? "grid-cols-3" :
                        "grid-cols-2 md:grid-cols-4"
                      }`}>
                        {page.panels.map((panel, panelIndex) => (
                          <div key={panelIndex} className="relative group">
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <Image
                                src={panel.imageUrl}
                                alt={`Page ${page.pageNumber} Panel ${panelIndex + 1}`}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => handleDownload(panel.imageUrl, `page-${page.pageNumber}-panel-${panelIndex + 1}.png`)}
                                  className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 transition-opacity"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                              </div>
                            </div>
                            
                            {/* Dialogue and Narration */}
                            {(panel.dialogue || panel.narration) && (
                              <div className="mt-2 text-xs space-y-1">
                                {panel.dialogue && (
                                  <p className="text-gray-700 dark:text-gray-300 italic">
                                    &ldquo;{panel.dialogue}&rdquo;
                                  </p>
                                )}
                                {panel.narration && (
                                  <p className="text-gray-500 dark:text-gray-400">
                                    {panel.narration}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Complete Manga Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    if (!result.manga) return;
                    // Create a downloadable JSON of the complete manga
                    const mangaData = JSON.stringify(result.manga, null, 2);
                    const blob = new Blob([mangaData], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${result.manga.title.replace(/\s+/g, "-")}-complete-manga.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Manga Production
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 dark:text-green-200">
              {result.manga 
                ? `Complete manga "${result.manga.title}" generated successfully! All ${result.manga.totalPages} pages have been saved to your project.`
                : "Production generated successfully! All assets have been saved to your project."
              }
            </p>
          </div>
        </div>
      )}

      {/* Recent Generations */}
      {assets.length > 0 && !result && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Recent Productions</h3>
          <div className="space-y-3">
            {assets.slice(0, 5).map((asset) => (
              <div
                key={asset.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{asset.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {asset.inputPrompt}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
