"use client";

import { useState } from "react";
import { Download, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface Asset {
  id: string;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: Date;
}

interface TextToolProps {
  projectId: string;
  assets: Asset[];
}

export default function TextTool({ projectId, assets }: TextToolProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [model, setModel] = useState("gpt-4o-mini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/generate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          systemPrompt: systemPrompt || undefined,
          temperature,
          maxTokens,
          model,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const { result: generationResult } = await response.json();
      setResult(generationResult.content);

      // Save to assets
      await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TEXT",
          title: title || `Text - ${new Date().toLocaleString()}`,
          inputPrompt: prompt,
          outputData: { content: generationResult.content },
          metadata: {
            model: generationResult.model,
            temperature,
            maxTokens,
            systemPrompt,
            usage: generationResult.usage,
          },
        }),
      });

      router.refresh();
      setTitle("");
      setPrompt("");
    } catch (error) {
      console.error("Error generating text:", error);
      alert("Failed to generate text");
    } finally {
      setLoading(false);
    }
  };

  const exportAsMarkdown = (content: string, assetTitle: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assetTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = (asset: Asset) => {
    const blob = new Blob([JSON.stringify(asset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Generate Text</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="My text generation"
              />
            </div>

            <div>
              <label className="label">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input"
                rows={6}
                placeholder="Write an article about..."
              />
            </div>

            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div>
                  <label className="label">System Prompt</label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="You are a helpful assistant..."
                  />
                </div>

                <div>
                  <label className="label">Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="input"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Temperature: {temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="label">Max Tokens</label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="input"
                    min="100"
                    max="4000"
                  />
                </div>
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Text"
              )}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <h3 className="font-semibold mb-2">Result:</h3>
              <div className="whitespace-pre-wrap text-sm">{result}</div>
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
              <p>No text generations yet</p>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          exportAsMarkdown(asset.outputData.content, asset.title)
                        }
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Export as Markdown"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportAsJSON(asset)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Export as JSON"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(asset.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Prompt:</strong> {asset.inputPrompt}
                  </p>
                  <div className="text-sm whitespace-pre-wrap line-clamp-3">
                    {asset.outputData.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
