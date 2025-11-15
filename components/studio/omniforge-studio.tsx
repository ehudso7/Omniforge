"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductionProgress {
  stage: string;
  progress: number;
  message: string;
  currentAsset?: string;
}

export default function OmniForgeStudio() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProductionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const examples = [
    "Create a sci-fi short story about AI discovering emotions",
    "Launch campaign for a sustainable coffee brand",
    "Educational content about photosynthesis for 5th graders",
    "Epic fantasy adventure with dragons and magic",
    "Product showcase for minimalist smartwatch",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      setError("Please enter a more detailed prompt (at least 10 characters)");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setProgress({
      stage: "starting",
      progress: 0,
      message: "Initializing production...",
    });

    try {
      // Simulate progress updates (in production, use websockets or SSE)
      const progressStages = [
        { stage: "analyzing", progress: 15, message: "Analyzing your prompt..." },
        { stage: "planning", progress: 30, message: "Planning production strategy..." },
        { stage: "generating_text", progress: 50, message: "Creating content..." },
        { stage: "generating_images", progress: 75, message: "Generating visuals..." },
        { stage: "finalizing", progress: 95, message: "Finalizing production..." },
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProgress(progressStages[currentStage]);
          currentStage++;
        }
      }, 2000);

      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Production failed");
      }

      const result = await response.json();

      setProgress({
        stage: "complete",
        progress: 100,
        message: "Production complete! 🎉",
      });

      // Redirect to the new project
      setTimeout(() => {
        router.push(`/dashboard/projects/${result.project.id}`);
      }, 1500);
    } catch (error) {
      console.error("Generation error:", error);
      setError(error instanceof Error ? error.message : "Something went wrong");
      setProgress(null);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Single-Prompt Production Studio
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            OmniForge Studio
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            One prompt. Complete production. Text, images, and more—generated
            together, perfectly.
          </p>
        </div>

        {/* Main Prompt Input */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            {!isGenerating ? (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  What would you like to create?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Describe your vision... Be creative! We'll handle the production."
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-lg"
                  rows={6}
                  disabled={isGenerating}
                />

                {error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      Cmd/Ctrl + Enter
                    </kbd>{" "}
                    to create
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-5 h-5" />
                    Create Production
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Example Prompts */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Try these examples:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {examples.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(example)}
                        className="text-left p-3 bg-gray-50 dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Production Progress */
              <div className="py-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Creating Your Production
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {progress?.message || "Processing..."}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress?.progress || 0}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {progress?.progress || 0}% complete
                </p>

                {/* Stage Indicators */}
                <div className="mt-8 grid grid-cols-5 gap-2">
                  {["Analyze", "Plan", "Create", "Enhance", "Finalize"].map(
                    (stage, idx) => (
                      <div key={idx} className="text-center">
                        <div
                          className={`w-full h-2 rounded-full mb-1 transition-colors ${
                            (progress?.progress || 0) > idx * 20
                              ? "bg-indigo-600"
                              : "bg-gray-300 dark:bg-gray-700"
                          }`}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {stage}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {/* Fun facts while waiting */}
                <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 text-center">
                    💡 {getRandomFact()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          {!isGenerating && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Intelligent Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI understands your intent and creates the perfect content mix
                </p>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Multi-Modal Magic
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Text, images, and audio created together for maximum impact
                </p>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Production Ready
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional quality output, ready to use immediately
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRandomFact(): string {
  const facts = [
    "We're analyzing your prompt to determine the best content mix...",
    "Creating complementary assets that work together perfectly...",
    "Using advanced AI models to ensure production quality...",
    "Your content is being optimized for maximum impact...",
    "Generating visuals that match your content's tone and style...",
  ];
  return facts[Math.floor(Math.random() * facts.length)];
}
