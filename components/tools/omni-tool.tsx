"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ModeKey = "text" | "image" | "audio" | "video";

type AssetType = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";

interface AssetPayload {
  id: string;
  type: AssetType;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: string;
}

interface GenerationResult {
  type: AssetType;
  status: "success" | "error" | "pending";
  asset?: AssetPayload;
  error?: string;
}

interface OmniBlueprint {
  title: string;
  summary: string;
  tone: string;
  textBrief: string;
  imagePrompt: string;
  audioNarration: string;
  videoStoryboardConcept: string;
  keywords: string[];
}

interface OmniToolProps {
  projectId: string;
}

const MODE_CONFIG: Record<
  ModeKey,
  { label: string; description: string; icon: LucideIcon; assetType: AssetType }
> = {
  text: {
    label: "Narrative",
    description: "Long-form copy/script",
    icon: FileText,
    assetType: "TEXT",
  },
  image: {
    label: "Key Art",
    description: "Hero image & concept art",
    icon: ImageIcon,
    assetType: "IMAGE",
  },
  audio: {
    label: "Voiceover",
    description: "Cinematic narration",
    icon: Music,
    assetType: "AUDIO",
  },
  video: {
    label: "Storyboard",
    description: "Frame-by-frame plan",
    icon: Video,
    assetType: "VIDEO",
  },
};

const VOICES = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

export default function OmniTool({ projectId }: OmniToolProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [modes, setModes] = useState<Record<ModeKey, boolean>>({
    text: true,
    image: true,
    audio: true,
    video: true,
  });
  const [voice, setVoice] = useState("alloy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blueprint, setBlueprint] = useState<OmniBlueprint | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);

  const selectedCount = Object.values(modes).filter(Boolean).length;

  const toggleMode = (key: ModeKey) => {
    setModes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const presetPendingResults = () => {
    const pending: GenerationResult[] = [];
    (Object.keys(modes) as ModeKey[]).forEach((key) => {
      if (modes[key]) {
        pending.push({
          type: MODE_CONFIG[key].assetType,
          status: "pending",
        });
      }
    });
    setResults(pending);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Enter a creative prompt to get started.");
      return;
    }
    if (selectedCount === 0) {
      setError("Select at least one output mode.");
      return;
    }

    setLoading(true);
    setError("");
    presetPendingResults();

    try {
      const response = await fetch("/api/generate/omni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt,
          modes,
          voice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setBlueprint(data.blueprint);
      setResults(
        data.results?.map((result: GenerationResult) => ({
          ...result,
          status: result.status,
        })) || []
      );

      setPrompt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setResults((prev) =>
        prev.map((result) =>
          result.status === "pending"
            ? { ...result, status: "error", error: "Request aborted" }
            : result
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const renderResultPreview = (result: GenerationResult) => {
    if (result.status !== "success" || !result.asset) {
      if (result.status === "error") {
        return (
          <p className="text-sm text-red-500">
            {result.error || "Failed to generate this modality."}
          </p>
        );
      }
      return (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </p>
      );
    }

    const { asset } = result;

    switch (asset.type) {
      case "TEXT": {
        return (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(asset.createdAt).toLocaleString()}
            </p>
            <p className="text-sm whitespace-pre-wrap line-clamp-6">
              {asset.outputData?.content}
            </p>
          </div>
        );
      }
      case "IMAGE": {
        return (
            <div className="mt-2">
              <div className="relative w-full aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={asset.outputData?.url}
                  alt={asset.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>
        );
      }
      case "AUDIO": {
        return (
          <div className="mt-2 space-y-2">
            <audio controls className="w-full" src={asset.outputData?.url}>
              Your browser does not support the audio element.
            </audio>
            <p className="text-xs text-gray-500">
              Duration ≈ {asset.outputData?.duration || 0}s · Voice:{" "}
              {asset.metadata?.voice || voice}
            </p>
          </div>
        );
      }
      case "VIDEO": {
        const frames = asset.outputData?.frames || [];
        return (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {asset.outputData?.script}
            </p>
            <div className="space-y-1">
              {frames.slice(0, 4).map((frame: any, index: number) => (
                <div key={`${asset.id}-frame-${index}`}>
                  <p className="text-xs font-semibold">
                    Frame {index + 1}: {frame.title}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {frame.description}
                  </p>
                </div>
              ))}
              {frames.length > 4 && (
                <p className="text-xs text-gray-500">
                  + {frames.length - 4} more frames
                </p>
              )}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Omni Production Engine
          </p>
          <h2 className="text-3xl font-bold mt-2">
            One prompt. Full production suite.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Describe your concept once—OmniForge builds the narrative, key art,
            cinematic voiceover, and storyboard in one pass.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Creative Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="input"
            placeholder="E.g., An ethereal product launch in zero-gravity, blending bioluminescent fashion with orchestral electronica..."
          />
        </div>

        <div>
          <label className="label">Outputs</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(modes) as ModeKey[]).map((key) => {
              const config = MODE_CONFIG[key];
              const Icon = config.icon;
              const active = modes[key];
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleMode(key)}
                  className={`border rounded-md p-3 text-left transition-colors ${
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <p className="font-semibold">{config.label}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {modes.audio && (
          <div>
            <label className="label">Voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="input"
            >
              {VOICES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn btn-primary w-full flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating suite...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Multi-Modal Suite
            </>
          )}
        </button>
      </div>

      {blueprint && (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
            Creative Blueprint
          </p>
          <h3 className="text-2xl font-semibold">{blueprint.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">
            {blueprint.summary}
          </p>
          {blueprint.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {blueprint.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1 text-xs uppercase tracking-wide bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 space-y-4">
          {results.map((result) => {
            const configEntry = Object.values(MODE_CONFIG).find(
              (cfg) => cfg.assetType === result.type
            );
            const Icon = configEntry?.icon ?? Sparkles;
            return (
              <div
                key={result.type}
                className="border border-gray-200 dark:border-gray-700 rounded-md p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="w-4 h-4" />
                    {configEntry?.label || result.type}
                  </div>
                  {result.status === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : result.status === "error" ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  )}
                </div>
                {renderResultPreview(result)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
