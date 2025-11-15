"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  Music,
  Sparkles,
  Video,
} from "lucide-react";

interface Asset {
  id: string;
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata?: Record<string, any>;
  createdAt: string | Date;
}

interface ProductionToolProps {
  projectId: string;
  assets: Asset[];
}

interface ProductionResponse {
  runId: string;
  plan: {
    title: string;
    summary: string;
    script: string;
    audioNarration: string;
    visualPrompt: string;
    videoConcept: string;
    keywords: string[];
    callToAction?: string;
  };
  assets: Partial<Record<"text" | "image" | "audio" | "video", Asset>>;
  errors?: Record<string, string>;
}

export default function ProductionTool({
  projectId,
  assets,
}: ProductionToolProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [includeText, setIncludeText] = useState(true);
  const [includeImage, setIncludeImage] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeVideo, setIncludeVideo] = useState(true);
  const [audioVoice, setAudioVoice] = useState("alloy");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [videoFrames, setVideoFrames] = useState(6);
  const [videoDuration, setVideoDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionResponse | null>(null);

  const productionRuns = useMemo(() => {
    const grouped: Record<
      string,
      {
        assets: Asset[];
        createdAt: string;
      }
    > = {};

    assets.forEach((asset) => {
      const runId = asset.metadata?.productionRunId;
      if (!runId) return;
      const assetDate = new Date(asset.createdAt);
      const assetTimestamp = assetDate.toISOString();
      if (!grouped[runId]) {
        grouped[runId] = { assets: [], createdAt: assetTimestamp };
      }
      grouped[runId].assets.push(asset);
      if (
        assetDate.getTime() >
        new Date(grouped[runId].createdAt).getTime()
      ) {
        grouped[runId].createdAt = assetTimestamp;
      }
    });

    return Object.entries(grouped)
      .map(([runId, data]) => ({
        runId,
        assets: data.assets,
        createdAt: data.createdAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [assets]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt,
          includeText,
          includeImage,
          includeAudio,
          includeVideo,
          audioVoice,
          imageSize,
          videoFrames,
          videoDuration,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Production failed");
      }

      setResult(data);
      setPrompt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Production failed");
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryAsset = (asset: Asset) => {
    switch (asset.type) {
      case "TEXT":
        return (
          <div key={asset.id} className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <FileText className="w-4 h-4" />
              Narrative
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line line-clamp-4">
              {asset.outputData?.summary || asset.outputData?.script}
            </p>
          </div>
        );
      case "IMAGE":
        return (
          <div key={asset.id} className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <ImageIcon className="w-4 h-4" />
              Key Art
            </div>
            {asset.outputData?.url ? (
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900">
                <Image
                  src={asset.outputData.url}
                  alt={asset.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No image url available.</p>
            )}
          </div>
        );
      case "AUDIO":
        return (
          <div key={asset.id} className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Music className="w-4 h-4" />
              Voiceover
            </div>
            {asset.outputData?.dataUrl || asset.outputData?.url ? (
              <audio
                controls
                src={asset.outputData.dataUrl || asset.outputData.url}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-gray-500">No audio stream stored.</p>
            )}
          </div>
        );
      case "VIDEO":
        return (
          <div key={asset.id} className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Video className="w-4 h-4" />
              Storyboard
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
              {asset.outputData?.frames
                ?.map(
                  (frame: any, idx: number) =>
                    `${idx + 1}. ${frame.title ?? "Frame"}`
                )
                .join(" • ")}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Single Prompt Production</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Orchestrate copy, art, audio, and storyboard outputs from one Suno-style
              prompt.
            </p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="input h-32"
          placeholder="Describe the production you want to generate..."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeText}
              onChange={(e) => setIncludeText(e.target.checked)}
            />
            Narrative
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeImage}
              onChange={(e) => setIncludeImage(e.target.checked)}
            />
            Key Art
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeAudio}
              onChange={(e) => setIncludeAudio(e.target.checked)}
            />
            Voiceover
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeVideo}
              onChange={(e) => setIncludeVideo(e.target.checked)}
            />
            Storyboard
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="label mb-1">Voice</p>
            <select
              value={audioVoice}
              onChange={(e) => setAudioVoice(e.target.value)}
              className="input"
              disabled={!includeAudio}
            >
              {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map(
                (voice) => (
                  <option key={voice} value={voice}>
                    {voice.toUpperCase()}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <p className="label mb-1">Image Size</p>
            <select
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              className="input"
              disabled={!includeImage}
            >
              <option value="1024x1024">Square 1024</option>
              <option value="1792x1024">Landscape 1792x1024</option>
              <option value="1024x1792">Portrait 1024x1792</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label mb-1">Frames</p>
              <input
                type="number"
                min={3}
                max={12}
                value={videoFrames}
                onChange={(e) => setVideoFrames(parseInt(e.target.value, 10))}
                className="input"
                disabled={!includeVideo}
              />
            </div>
            <div>
              <p className="label mb-1">Duration (s)</p>
              <input
                type="number"
                min={15}
                max={240}
                value={videoDuration}
                onChange={(e) =>
                  setVideoDuration(parseInt(e.target.value, 10))
                }
                className="input"
                disabled={!includeVideo}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={
            loading ||
            !prompt.trim() ||
            (!includeText && !includeImage && !includeAudio && !includeVideo)
          }
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Producing...
            </>
          ) : (
            "Run Production"
          )}
        </button>
      </div>

      {result && (
        <div className="card space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Production complete (Run {result.runId})
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Creative Brief</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {result.plan.summary}
            </p>
            {result.plan.callToAction && (
              <p className="text-sm text-blue-600 mt-2">
                CTA: {result.plan.callToAction}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.assets.text && renderHistoryAsset(result.assets.text)}
            {result.assets.image && renderHistoryAsset(result.assets.image)}
            {result.assets.audio && renderHistoryAsset(result.assets.audio)}
            {result.assets.video && renderHistoryAsset(result.assets.video)}
          </div>

          {result.errors && Object.keys(result.errors).length > 0 && (
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              Some modalities failed:{" "}
              {Object.entries(result.errors)
                .filter(([, message]) => Boolean(message))
                .map(([key, message]) => `${key}: ${message}`)
                .join(", ")}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5" />
          <h3 className="text-xl font-semibold">Production History</h3>
        </div>

        {productionRuns.length === 0 ? (
          <p className="text-sm text-gray-500">
            Run a production to build your history.
          </p>
        ) : (
          <div className="space-y-4">
            {productionRuns.map((run) => (
              <div
                key={run.runId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Run {run.runId}</span>
                  <span>{new Date(run.createdAt).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {run.assets.map((asset) => renderHistoryAsset(asset))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
