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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
      <div className="max-w-5xl mx-auto px-4 text-center">
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6 animate-pulse">
          ✨ Single-Prompt Production Studio
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          OmniForge Studio
        </h1>
        <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4 font-medium">
          One Prompt. Complete Production.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Like Suno for everything. Enter your vision, get production-ready content with text, images, audio, and more—generated together, perfectly.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center mb-16">
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-2xl hover:shadow-3xl transition-all text-lg"
          >
            Get Started Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link 
            href="/auth/signin" 
            className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 transition-all text-lg"
          >
            Sign In
          </Link>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              💭
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">1. Enter Your Vision</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Describe what you want to create in a single prompt. No complexity, just your idea.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✨
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">2. AI Orchestrates</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI analyzes your prompt and intelligently creates complementary content.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🎉
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">3. Get Production</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Receive a complete package ready to use—text, images, and more.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Perfect for Every Creative Need
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Stories</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🚀</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Marketing</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🎓</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Education</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🎬</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
