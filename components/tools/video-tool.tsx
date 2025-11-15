"use client";

import { useState } from "react";
import { Download, Clock, Loader2, Video as VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Asset {
  id: string;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: string | Date;
}

interface VideoToolProps {
  projectId: string;
  assets: Asset[];
}

export default function VideoTool({ projectId, assets }: VideoToolProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [concept, setConcept] = useState("");
  const [numberOfFrames, setNumberOfFrames] = useState(5);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generate = async () => {
    if (!concept.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          numberOfFrames,
          duration,
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
          type: "VIDEO",
          title: title || `Video Storyboard - ${new Date().toLocaleString()}`,
          inputPrompt: concept,
          outputData: {
            script: generationResult.script,
            frames: generationResult.frames,
            totalDuration: generationResult.totalDuration,
          },
          metadata: {
            numberOfFrames,
            duration,
          },
        }),
      });

      router.refresh();
      setTitle("");
      setConcept("");
    } catch (error) {
      console.error("Error generating storyboard:", error);
      alert("Failed to generate storyboard");
    } finally {
      setLoading(false);
    }
  };

  const exportStoryboard = (storyboard: any, assetTitle: string) => {
    const markdown = `# ${assetTitle}\n\n## Script\n${storyboard.script}\n\n## Storyboard\n\n${storyboard.frames
      .map(
        (frame: any, i: number) =>
          `### Frame ${i + 1}: ${frame.title}\n**Duration:** ${frame.duration}s\n**Description:** ${frame.description}\n`
      )
      .join("\n")}`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assetTitle}-storyboard.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Generate Video Storyboard</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="My video storyboard"
              />
            </div>

            <div>
              <label className="label">Video Concept</label>
              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="input"
                rows={4}
                placeholder="Describe your video concept..."
              />
            </div>

            <div>
              <label className="label">Number of Frames</label>
              <input
                type="number"
                value={numberOfFrames}
                onChange={(e) => setNumberOfFrames(parseInt(e.target.value))}
                className="input"
                min="1"
                max="20"
              />
            </div>

            <div>
              <label className="label">Total Duration (seconds)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="input"
                min="5"
                max="300"
              />
            </div>

            <button
              onClick={generate}
              disabled={loading || !concept.trim()}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Storyboard"
              )}
            </button>
          </div>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="font-semibold mb-2">Script</h3>
                <p className="text-sm whitespace-pre-wrap">{result.script}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Frames</h3>
                {result.frames.map((frame: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium">
                        Frame {i + 1}: {frame.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {frame.duration}s
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {frame.description}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Duration: {result.totalDuration}s
              </p>
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
              <p>No storyboards generated yet</p>
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
                    <button
                      onClick={() => exportStoryboard(asset.outputData, asset.title)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Export storyboard"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(asset.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Concept:</strong> {asset.inputPrompt}
                  </p>
                  <p className="text-xs text-gray-500">
                    {asset.outputData.frames?.length || 0} frames •{" "}
                    {asset.outputData.totalDuration}s
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
