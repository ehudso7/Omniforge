"use client";

import { useState } from "react";
import { Clock, Loader2, Music, AudioLines } from "lucide-react";
import { useRouter } from "next/navigation";

interface Asset {
  id: string;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: string | Date;
}

interface AudioToolProps {
  projectId: string;
  assets: Asset[];
}

export default function AudioTool({ projectId, assets }: AudioToolProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState<"speech" | "music">("speech");
  const [voice, setVoice] = useState("alloy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    dataUrl?: string;
    url?: string;
    duration?: number;
    format?: string;
  } | null>(null);

  const generate = async () => {
    if (!text.trim()) return;

    setLoading(true);
      setResult(null);

    try {
      const response = await fetch("/api/generate/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          text,
          voice: type === "speech" ? voice : undefined,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

        const { result: generationResult } = await response.json();
        setResult(generationResult);

      // Save to assets
      await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "AUDIO",
          title: title || `Audio - ${new Date().toLocaleString()}`,
          inputPrompt: text,
            outputData: {
              dataUrl: generationResult.dataUrl ?? generationResult.url,
              url: generationResult.url,
              duration: generationResult.duration,
              format: generationResult.format,
            },
          metadata: {
            model: generationResult.model,
            type,
            voice: type === "speech" ? voice : undefined,
          },
        }),
      });

      router.refresh();
      setTitle("");
        setText("");
    } catch (error) {
      console.error("Error generating audio:", error);
      alert("Failed to generate audio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Generate Audio</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setType("speech")}
                  className={`px-4 py-2 rounded-md border ${
                    type === "speech"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  Text-to-Speech
                </button>
                <button
                  onClick={() => setType("music")}
                  className={`px-4 py-2 rounded-md border ${
                    type === "music"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  Music (Stub)
                </button>
              </div>
            </div>

            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="My audio"
              />
            </div>

            <div>
              <label className="label">
                {type === "speech" ? "Text to speak" : "Music description"}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input"
                rows={6}
                placeholder={
                  type === "speech"
                    ? "Enter the text you want to convert to speech..."
                    : "Describe the music you want to generate..."
                }
              />
            </div>

            {type === "speech" && (
              <div>
                <label className="label">Voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="input"
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading || !text.trim()}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Audio"
              )}
            </button>
          </div>

            {result && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AudioLines className="w-4 h-4" />
                  Preview
                </h3>
                {result.dataUrl || result.url ? (
                  <audio
                    controls
                    src={result.dataUrl || result.url}
                    className="w-full"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No audio stream available.
                  </p>
                )}
                {result.duration && (
                  <p className="text-xs text-gray-500">
                    Duration: ~{result.duration}s
                  </p>
                )}
              </div>
            )}
        </div>
      </div>

      <div>
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">History</h2>

          {assets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No audio generated yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{asset.title}</h3>
                    <Music className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(asset.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Type:</strong> {asset.metadata?.type || "unknown"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Input:</strong> {asset.inputPrompt}
                  </p>
                    {asset.outputData?.dataUrl || asset.outputData?.url ? (
                      <audio
                        controls
                        src={asset.outputData.dataUrl || asset.outputData.url}
                        className="w-full mt-2"
                      />
                    ) : null}
                    {asset.outputData?.duration && (
                      <p className="text-xs text-gray-500">
                        Duration: ~{asset.outputData.duration}s
                      </p>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
