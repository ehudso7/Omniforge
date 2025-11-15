import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          OmniForge Studio
        </h1>
        <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4">
          Universal Generative Creation Studio
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Create, manage, and export AI-generated content across multiple modalities.
          Generate text, images, audio, and video from a single unified interface.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-bold text-lg mb-2">Text Generation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create articles, stories, scripts, and marketing copy with advanced LLMs
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-bold text-lg mb-2">Image Creation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate and upscale images for cover art, thumbnails, and social media
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-3">🎵</div>
            <h3 className="font-bold text-lg mb-2">Audio Generation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create voiceovers and music with text-to-speech and audio synthesis
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-3">🎬</div>
            <h3 className="font-bold text-lg mb-2">Video Storyboards</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Design video sequences with storyboards, scripts, and frame planning
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin" className="btn btn-primary text-lg px-8 py-3">
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn btn-secondary text-lg px-8 py-3">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
