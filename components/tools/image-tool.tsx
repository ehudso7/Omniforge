"use client";

import { useState } from "react";
import { Download, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Asset {
  id: string;
  title: string;
  inputPrompt: string;
  outputData: any;
  metadata: any;
  createdAt: Date;
}

interface ImageToolProps {
  projectId: string;
  assets: Asset[];
}

export default function ImageTool({ projectId, assets }: ImageToolProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [model, setModel] = useState("dall-e-3");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const [width, height] = size.split("x").map(Number);

      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt: negativePrompt || undefined,
          width,
          height,
          model,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const { result: generationResult } = await response.json();
      setResult(generationResult.url);

      // Save to assets
      await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "IMAGE",
          title: title || `Image - ${new Date().toLocaleString()}`,
          inputPrompt: prompt,
          outputData: {
            url: generationResult.url,
            revisedPrompt: generationResult.revisedPrompt,
          },
          metadata: {
            model: generationResult.model,
            size,
            negativePrompt,
          },
        }),
      });

      router.refresh();
      setTitle("");
      setPrompt("");
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Generate Image</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="My image"
              />
            </div>

            <div>
              <label className="label">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input"
                rows={4}
                placeholder="A futuristic city at sunset..."
              />
            </div>

            <div>
              <label className="label">Negative Prompt (optional)</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="input"
                placeholder="blur, low quality..."
              />
            </div>

            <div>
              <label className="label">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input"
              >
                <option value="dall-e-3">DALL-E 3</option>
                <option value="dall-e-2">DALL-E 2</option>
              </select>
            </div>

            <div>
              <label className="label">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="input"
              >
                <option value="1024x1024">Square (1024x1024)</option>
                <option value="1792x1024">Landscape (1792x1024)</option>
                <option value="1024x1792">Portrait (1024x1792)</option>
              </select>
            </div>

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
                "Generate Image"
              )}
            </button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Result:</h3>
              <div className="relative w-full aspect-square rounded-md overflow-hidden">
                <Image
                  src={result}
                  alt="Generated"
                  fill
                  className="object-contain"
                />
              </div>
              <a
                href={result}
                download
                className="btn btn-secondary w-full mt-2 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
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
              <p>No images generated yet</p>
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
                    <a
                      href={asset.outputData.url}
                      download
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(asset.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Prompt:</strong> {asset.inputPrompt}
                  </p>
                  <div className="relative w-full aspect-square rounded-md overflow-hidden mt-2">
                    <Image
                      src={asset.outputData.url}
                      alt={asset.title}
                      fill
                      className="object-contain"
                    />
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
