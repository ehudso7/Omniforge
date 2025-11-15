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

type ProductionAssetType = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";

interface Asset {
  id: string;
  type: ProductionAssetType;
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

interface ProductionRunAggregate {
  runId: string;
  createdAt: string;
  assets: Asset[];
  byType: Partial<Record<ProductionAssetType, Asset>>;
}

interface ProductionRunDisplay extends ProductionRunAggregate {
  title: string;
  summary: string;
  callToAction?: string;
  keywords: string[];
  prompt?: string;
  textAsset?: Asset;
  imageAsset?: Asset;
  audioAsset?: Asset;
  videoAsset?: Asset;
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

  const productionRuns = useMemo<ProductionRunAggregate[]>(() => {
    const grouped: Record<
      string,
      {
        assets: Asset[];
        createdAt: string;
        byType: Partial<Record<ProductionAssetType, Asset>>;
      }
    > = {};

    assets.forEach((asset) => {
      const runId = asset.metadata?.productionRunId;
      if (!runId) return;
      const assetDate = new Date(asset.createdAt);
      const assetTimestamp = assetDate.toISOString();
      if (!grouped[runId]) {
        grouped[runId] = { assets: [], createdAt: assetTimestamp, byType: {} };
      }
      grouped[runId].assets.push(asset);
      grouped[runId].byType[asset.type] = asset;
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
        byType: data.byType,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [assets]);

  const formattedRuns = useMemo<ProductionRunDisplay[]>(
    () => productionRuns.map((run) => buildRunDisplay(run)),
    [productionRuns]
  );

  const liveRunAggregate = useMemo<ProductionRunAggregate | null>(() => {
    if (!result) return null;
    const aggregate: ProductionRunAggregate = {
      runId: result.runId,
      createdAt: new Date().toISOString(),
      assets: [],
      byType: {},
    };

    const pushAsset = (type: ProductionAssetType, asset?: Asset) => {
      if (!asset) return;
      aggregate.byType[type] = asset;
      aggregate.assets.push(asset);
    };

    pushAsset("TEXT", result.assets.text);
    pushAsset("IMAGE", result.assets.image);
    pushAsset("AUDIO", result.assets.audio);
    pushAsset("VIDEO", result.assets.video);

    return aggregate.assets.length ? aggregate : null;
  }, [result]);

  const liveRunDisplay = useMemo<ProductionRunDisplay | null>(
    () =>
      liveRunAggregate && result
        ? buildRunDisplay(liveRunAggregate, result.plan)
        : null,
    [liveRunAggregate, result]
  );

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

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Single Prompt Production</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Feed OmniForge a single brief and receive a fully authored manga episode:
              narrative script, hero art, voiced narration, and cinematic storyboard.
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

      {liveRunDisplay && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            Latest Production (preview)
          </div>
          <ProductionRunCard data={liveRunDisplay} highlight />
          {result?.errors && Object.keys(result.errors).length > 0 && (
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
            <h3 className="text-xl font-semibold">Recent Productions</h3>
        </div>

          {formattedRuns.length === 0 ? (
          <p className="text-sm text-gray-500">
            Run a production to build your history.
          </p>
        ) : (
            <div className="space-y-6">
              {formattedRuns.map((run) => (
                <ProductionRunCard key={run.runId} data={run} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildRunDisplay(
  run: ProductionRunAggregate,
  planOverride?: ProductionResponse["plan"]
): ProductionRunDisplay {
  const textAsset = run.byType.TEXT;
  const title =
    planOverride?.title ??
    textAsset?.outputData?.title ??
    textAsset?.title ??
    "OmniForge Production";
  const summary =
    planOverride?.summary ??
    textAsset?.outputData?.summary ??
    textAsset?.metadata?.summary ??
    textAsset?.inputPrompt ??
    "";
  const callToAction =
    planOverride?.callToAction ?? textAsset?.outputData?.callToAction;
  const keywordsSource =
    planOverride?.keywords ?? textAsset?.outputData?.keywords ?? [];
  const keywords = Array.isArray(keywordsSource)
    ? keywordsSource
    : typeof keywordsSource === "string"
    ? keywordsSource.split(",").map((keyword) => keyword.trim())
    : [];
  const prompt = textAsset?.metadata?.userPrompt ?? textAsset?.inputPrompt;

  return {
    ...run,
    title,
    summary,
    callToAction,
    keywords,
    prompt,
    textAsset,
    imageAsset: run.byType.IMAGE,
    audioAsset: run.byType.AUDIO,
    videoAsset: run.byType.VIDEO,
  };
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProductionRunCard({
  data,
  highlight = false,
}: {
  data: ProductionRunDisplay;
  highlight?: boolean;
}) {
  const { title, summary, callToAction, keywords, createdAt, prompt } = data;
  const imageAsset = data.imageAsset;
  const audioAsset = data.audioAsset;
  const videoAsset = data.videoAsset;
  const textAsset = data.textAsset;
  const storyboardFrames = Array.isArray(videoAsset?.outputData?.frames)
    ? videoAsset?.outputData?.frames.slice(0, 4)
    : [];

  return (
    <div
      className={`rounded-2xl border p-6 space-y-4 ${
        highlight
          ? "border-blue-200 ring-2 ring-blue-100"
          : "border-gray-200 dark:border-gray-700"
      } bg-white dark:bg-gray-900`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Run {data.runId}
          </p>
          <h4 className="text-2xl font-semibold">{title}</h4>
        </div>
        <span className="text-sm text-gray-500">
          {formatDateLabel(createdAt)}
        </span>
      </div>

      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {summary}
      </p>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {callToAction && (
        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200 text-sm">
          CTA: {callToAction}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {imageAsset && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <ImageIcon className="w-4 h-4" />
              Key Art
            </div>
            {imageAsset.outputData?.url ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={imageAsset.outputData.url}
                  alt={imageAsset.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No visual generated.</p>
            )}
            <p className="text-xs text-gray-500">
              Prompt: {imageAsset.inputPrompt}
            </p>
          </div>
        )}

        {audioAsset && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Music className="w-4 h-4" />
              Voiceover
            </div>
            {audioAsset.outputData?.dataUrl || audioAsset.outputData?.url ? (
              <audio
                controls
                src={audioAsset.outputData.dataUrl || audioAsset.outputData.url}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-gray-500">No audio stream stored.</p>
            )}
            <p className="text-xs text-gray-500">
              Voice: {audioAsset.metadata?.voice?.toUpperCase?.() || "custom"} ·
              Duration: ~{audioAsset.outputData?.duration || "--"}s
            </p>
          </div>
        )}

        {videoAsset && storyboardFrames.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Video className="w-4 h-4" />
              Storyboard
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {storyboardFrames.map((frame: any, index: number) => (
                <div key={index} className="text-sm text-gray-600">
                  <p className="font-semibold">
                    {index + 1}. {frame.title || "Frame"}
                  </p>
                  <p className="text-xs text-gray-500">{frame.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {textAsset && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <FileText className="w-4 h-4" />
              Script
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-6">
              {textAsset.outputData?.script}
            </p>
          </div>
        )}
      </div>

      {prompt && (
        <p className="text-xs text-gray-500">
          Prompt: <span className="italic">{prompt}</span>
        </p>
      )}
    </div>
  );
}
