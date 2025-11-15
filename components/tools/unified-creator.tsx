"use client";

import { useState } from "react";
import { Sparkles, Loader2, Download, Play, Image as ImageIcon, Music, Video, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UnifiedCreatorProps {
  projectId: string;
}

type ContentType = "auto" | "text" | "image" | "audio" | "video";

interface GenerationResult {
  contentType: ContentType;
  title: string;
  prompt: string;
  output: {
    text?: { content: string; wordCount: number; readingTime: number };
    image?: { url: string; revisedPrompt?: string };
    audio?: { url: string; duration: number; lyrics?: string };
    video?: { url: string; duration: number; script?: string; thumbnail?: string };
  };
  metadata: {
    model: string;
    generationTime: number;
  };
}

export default function UnifiedCreator({ projectId }: UnifiedCreatorProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<ContentType>("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/generate/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          contentType: contentType === "auto" ? undefined : contentType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const { result: generationResult } = await response.json();
      setResult(generationResult);

      // Auto-save to assets
      await saveToAssets(generationResult);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const saveToAssets = async (generationResult: GenerationResult) => {
    try {
      let assetType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" = "TEXT";
      let outputData: any = {};

      if (generationResult.output.text) {
        assetType = "TEXT";
        outputData = { content: generationResult.output.text.content };
      } else if (generationResult.output.image) {
        assetType = "IMAGE";
        outputData = {
          url: generationResult.output.image.url,
          revisedPrompt: generationResult.output.image.revisedPrompt,
        };
      } else if (generationResult.output.audio) {
        assetType = "AUDIO";
        outputData = {
          url: generationResult.output.audio.url,
          duration: generationResult.output.audio.duration,
          lyrics: generationResult.output.audio.lyrics,
        };
      } else if (generationResult.output.video) {
        assetType = "VIDEO";
        outputData = {
          url: generationResult.output.video.url,
          duration: generationResult.output.video.duration,
          script: generationResult.output.video.script,
        };
      }

      await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: assetType,
          title: generationResult.title,
          inputPrompt: generationResult.prompt,
          outputData,
          metadata: generationResult.metadata,
        }),
      });

      router.refresh();
    } catch (err) {
      console.error("Failed to save asset:", err);
    }
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case "text":
        return <FileText className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create with AI</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Describe what you want to create. We'll generate production-ready content instantly.
          </p>
        </div>

        {/* Content Type Selector */}
        <div className="mb-6">
          <label className="label mb-2">What would you like to create?</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(["auto", "text", "image", "audio", "video"] as ContentType[]).map((type) => (
              <button
                key={type}
                onClick={() => setContentType(type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  contentType === type
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {getContentIcon(type)}
                <span className="text-sm font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="label">Describe your creation</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="input min-h-[120px] text-lg"
            placeholder={
              contentType === "auto"
                ? "e.g., 'A catchy pop song about summer nights' or 'A professional article about AI'..."
                : contentType === "text"
                ? "e.g., 'Write an engaging article about sustainable technology'..."
                : contentType === "image"
                ? "e.g., 'A futuristic cityscape at sunset, cyberpunk style'..."
                : contentType === "audio"
                ? "e.g., 'An upbeat pop song about adventure and freedom'..."
                : "e.g., 'A cinematic video about space exploration'..."
            }
            rows={5}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Create Now
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getContentIcon(result.contentType)}
              <div>
                <h2 className="text-xl font-bold">{result.title}</h2>
                <p className="text-sm text-gray-500">
                  Generated in {result.metadata.generationTime.toFixed(1)}s
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setResult(null);
                setPrompt("");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {/* Text Result */}
          {result.output.text && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {result.output.text.wordCount} words • {result.output.text.readingTime} min read
                  </span>
                  <button
                    onClick={() => {
                      const blob = new Blob([result.output.text!.content], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${result.title}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  {result.output.text.content}
                </div>
              </div>
            </div>
          )}

          {/* Image Result */}
          {result.output.image && (
            <div className="space-y-4">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={result.output.image.url}
                  alt={result.title}
                  fill
                  className="object-contain"
                />
              </div>
              <a
                href={result.output.image.url}
                download
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Image
              </a>
            </div>
          )}

          {/* Audio Result */}
          {result.output.audio && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                    <Play className="w-6 h-6" />
                  </button>
                  <div>
                    <p className="font-semibold">{result.title}</p>
                    <p className="text-sm text-gray-500">
                      {Math.floor(result.output.audio.duration / 60)}:
                      {(result.output.audio.duration % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>
                {result.output.audio.lyrics && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <h3 className="font-semibold mb-2">Lyrics</h3>
                    <div className="text-sm whitespace-pre-wrap">{result.output.audio.lyrics}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Result */}
          {result.output.video && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">
                  Duration: {Math.floor(result.output.video.duration / 60)}:
                  {(result.output.video.duration % 60).toString().padStart(2, "0")}
                </p>
                {result.output.video.script && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Script</h3>
                    <div className="text-sm whitespace-pre-wrap">{result.output.video.script}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
