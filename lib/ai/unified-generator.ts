/**
 * Unified Generator - Suno-style single prompt to production-ready output
 * Takes a single prompt and generates complete, production-quality content
 */

import { generateText } from "./text-client";
import { generateImage } from "./image-client";
import { generateSpeech, generateMusic } from "./audio-client";
import { generateStoryboard, generateVideo } from "./video-client";
import { generateManga, MangaResult } from "./manga-generator";
import { compileManga } from "../manga-compiler";
import { ProgressTracker } from "../progress-tracker";
import { env } from "@/lib/env";

export type ContentType = "text" | "image" | "audio" | "video" | "manga" | "auto";

export interface UnifiedGenerationParams {
  prompt: string;
  contentType?: ContentType; // If "auto", we detect the intent
  title?: string;
  progressTracker?: ProgressTracker; // Optional progress tracker
  // Content-specific options
  textOptions?: {
    style?: "article" | "story" | "script" | "poem" | "marketing";
    length?: "short" | "medium" | "long";
  };
  imageOptions?: {
    style?: "photorealistic" | "artistic" | "illustration" | "3d";
    aspectRatio?: "square" | "landscape" | "portrait";
  };
  audioOptions?: {
    genre?: string;
    mood?: string;
    duration?: number; // seconds
    includeLyrics?: boolean;
  };
  videoOptions?: {
    style?: "cinematic" | "documentary" | "animated" | "vlog";
    duration?: number; // seconds
  };
  mangaOptions?: {
    pages?: number; // Number of pages (default: 10)
    style?: "shonen" | "shoujo" | "seinen" | "josei" | "comic" | "webtoon";
  };
}

export interface UnifiedGenerationResult {
  contentType: ContentType;
  title: string;
  prompt: string;
  output: {
    // Text output
    text?: {
      content: string;
      wordCount: number;
      readingTime: number; // minutes
    };
    // Image output
    image?: {
      url: string;
      revisedPrompt?: string;
    };
    // Audio output
    audio?: {
      url: string;
      duration: number;
      lyrics?: string;
      waveform?: string; // Base64 encoded waveform visualization
    };
    // Video output
    video?: {
      url: string;
      duration: number;
      thumbnail?: string;
      script?: string;
    };
    // Manga output
    manga?: MangaResult;
  };
  metadata: {
    model: string;
    generationTime: number; // seconds
    tokensUsed?: number;
  };
}

/**
 * Detect content type from prompt intent
 */
function detectContentType(prompt: string): ContentType {
  const lowerPrompt = prompt.toLowerCase();

  // Audio/music keywords
  if (
    lowerPrompt.includes("song") ||
    lowerPrompt.includes("music") ||
    lowerPrompt.includes("track") ||
    lowerPrompt.includes("melody") ||
    lowerPrompt.includes("beat") ||
    lowerPrompt.includes("lyrics") ||
    lowerPrompt.includes("sing") ||
    lowerPrompt.includes("audio")
  ) {
    return "audio";
  }

  // Manga/Comic keywords (check before video)
  if (
    lowerPrompt.includes("manga") ||
    lowerPrompt.includes("comic") ||
    lowerPrompt.includes("graphic novel") ||
    lowerPrompt.includes("webtoon") ||
    lowerPrompt.includes("manhwa") ||
    lowerPrompt.includes("panel") ||
    lowerPrompt.includes("shonen") ||
    lowerPrompt.includes("shoujo")
  ) {
    return "manga";
  }

  // Video keywords
  if (
    lowerPrompt.includes("video") ||
    lowerPrompt.includes("film") ||
    lowerPrompt.includes("movie") ||
    lowerPrompt.includes("animation") ||
    lowerPrompt.includes("cinematic") ||
    lowerPrompt.includes("scene")
  ) {
    return "video";
  }

  // Image keywords
  if (
    lowerPrompt.includes("image") ||
    lowerPrompt.includes("picture") ||
    lowerPrompt.includes("photo") ||
    lowerPrompt.includes("draw") ||
    lowerPrompt.includes("visual") ||
    lowerPrompt.includes("illustration") ||
    lowerPrompt.includes("artwork")
  ) {
    return "image";
  }

  // Text keywords (default)
  if (
    lowerPrompt.includes("article") ||
    lowerPrompt.includes("write") ||
    lowerPrompt.includes("story") ||
    lowerPrompt.includes("essay") ||
    lowerPrompt.includes("blog") ||
    lowerPrompt.includes("content")
  ) {
    return "text";
  }

  // Default to text if unclear
  return "text";
}

/**
 * Generate production-ready text content
 */
async function generateProductionText(
  prompt: string,
  options?: UnifiedGenerationParams["textOptions"]
): Promise<UnifiedGenerationResult["output"]["text"]> {
  const style = options?.style || "article";
  const length = options?.length || "medium";

  const stylePrompts: Record<string, string> = {
    article: "Write a well-structured, engaging article",
    story: "Write a compelling narrative story",
    script: "Write a professional script",
    poem: "Write a beautiful poem",
    marketing: "Write persuasive marketing copy",
  };

  const lengthTokens: Record<string, number> = {
    short: 500,
    medium: 1500,
    long: 3000,
  };

  const systemPrompt = `${stylePrompts[style]}. Make it production-ready, polished, and publication-quality.`;

  const result = await generateText({
    prompt,
    systemPrompt,
    temperature: style === "poem" ? 0.9 : 0.7,
    maxTokens: lengthTokens[length],
    model: "gpt-4o-mini",
  });

  const wordCount = result.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return {
    content: result.content,
    wordCount,
    readingTime,
  };
}

/**
 * Generate production-ready image
 */
async function generateProductionImage(
  prompt: string,
  options?: UnifiedGenerationParams["imageOptions"]
): Promise<UnifiedGenerationResult["output"]["image"]> {
  const style = options?.style || "photorealistic";
  const aspectRatio = options?.aspectRatio || "square";

  const styleEnhancements: Record<string, string> = {
    photorealistic: "professional photography, high quality, detailed",
    artistic: "artistic style, creative composition, visually striking",
    illustration: "digital illustration, clean lines, vibrant colors",
    "3d": "3D rendered, modern, polished",
  };

  const aspectRatios: Record<string, { width: number; height: number }> = {
    square: { width: 1024, height: 1024 },
    landscape: { width: 1792, height: 1024 },
    portrait: { width: 1024, height: 1792 },
  };

  const enhancedPrompt = `${prompt}, ${styleEnhancements[style]}, production quality, professional`;

  const { width, height } = aspectRatios[aspectRatio];
  const result = await generateImage({
    prompt: enhancedPrompt,
    width,
    height,
    model: "dall-e-3",
  });

  return {
    url: result.url,
    revisedPrompt: result.revisedPrompt,
  };
}

/**
 * Generate production-ready audio (complete song with lyrics)
 */
async function generateProductionAudio(
  prompt: string,
  options?: UnifiedGenerationParams["audioOptions"]
): Promise<UnifiedGenerationResult["output"]["audio"]> {
  const genre = options?.genre || "pop";
  const mood = options?.mood || "uplifting";
  const duration = options?.duration || 180; // 3 minutes default
  const includeLyrics = options?.includeLyrics !== false;

  let lyrics = "";

  // Generate lyrics if requested
  if (includeLyrics) {
    const lyricsPrompt = `Write complete song lyrics for a ${genre} song with a ${mood} mood. The theme is: ${prompt}. Include verses, chorus, and bridge. Make it production-ready.`;
    
    const lyricsResult = await generateText({
      prompt: lyricsPrompt,
      systemPrompt: "You are a professional songwriter. Write complete, polished song lyrics.",
      temperature: 0.8,
      maxTokens: 1000,
      model: "gpt-4o-mini",
    });

    lyrics = lyricsResult.content;
  }

  // Generate music (currently stub, but structured for real implementation)
  // In production, this would integrate with Suno API or similar
  const musicPrompt = `${prompt} - ${genre} style, ${mood} mood, ${duration} seconds`;
  
  // For now, use the stub but structure it properly
  const musicResult = await generateMusic({
    prompt: musicPrompt,
    duration,
  });

  // In production, this would be a real audio file URL
  // For now, we'll structure it for future integration
  return {
    url: musicResult.url,
    duration: musicResult.duration || duration,
    lyrics: lyrics || undefined,
    waveform: undefined, // Would be generated from audio file
  };
}

/**
 * Generate production-ready video
 */
async function generateProductionVideo(
  prompt: string,
  options?: UnifiedGenerationParams["videoOptions"],
  progressTracker?: ProgressTracker
): Promise<UnifiedGenerationResult["output"]["video"]> {
  const style = options?.style || "cinematic";
  const duration = options?.duration || 60; // 1 minute default

  // Generate storyboard first
  if (progressTracker) progressTracker.update("Storyboard", 20, "Creating video storyboard...");
  const storyboard = await generateStoryboard({
    concept: prompt,
    numberOfFrames: Math.ceil(duration / 5), // One frame per 5 seconds
    duration,
  });

  // Generate complete video from storyboard
  if (progressTracker) progressTracker.update("Frames", 40, "Generating video frames...");
  const videoResult = await generateVideo({
    storyboard,
    style,
  });

  return {
    url: videoResult.url,
    duration: videoResult.duration,
    thumbnail: undefined,
    script: storyboard.script,
  };
}

/**
 * Main unified generation function - Suno-style single prompt to production output
 */
export async function generateUnified(
  params: UnifiedGenerationParams,
  progressTracker?: ProgressTracker
): Promise<UnifiedGenerationResult> {
  const startTime = Date.now();
  const contentType = params.contentType || detectContentType(params.prompt);
  const title = params.title || `Generated ${contentType}`;
  
  const tracker = progressTracker || params.progressTracker;
  
  if (tracker) {
    tracker.update("Initializing", 5, `Preparing to generate ${contentType}...`);
  }

  let output: UnifiedGenerationResult["output"] = {};
  let model = "unified";
  let tokensUsed: number | undefined;

  try {
    switch (contentType) {
      case "text":
        if (tracker) tracker.update("Generating text", 30, "Writing content...");
        const textOutput = await generateProductionText(
          params.prompt,
          params.textOptions
        );
        output.text = textOutput;
        model = "gpt-4o-mini";
        if (tracker) tracker.update("Complete", 100, "Text generation complete!");
        break;

      case "image":
        if (tracker) tracker.update("Generating image", 50, "Creating image...");
        const imageOutput = await generateProductionImage(
          params.prompt,
          params.imageOptions
        );
        output.image = imageOutput;
        model = "dall-e-3";
        if (tracker) tracker.update("Complete", 100, "Image generation complete!");
        break;

      case "audio":
        if (tracker) tracker.update("Generating audio", 20, "Creating complete song...");
        const audioOutput = await generateProductionAudio(
          params.prompt,
          params.audioOptions
        );
        if (tracker) tracker.update("Mixing audio", 80, "Finalizing production...");
        output.audio = audioOutput;
        model = "music-generation-complete";
        if (tracker) tracker.update("Complete", 100, "Song generation complete!");
        break;

      case "video":
        if (tracker) tracker.update("Generating video", 10, "Creating storyboard...");
        const videoOutput = await generateProductionVideo(
          params.prompt,
          params.videoOptions,
          tracker
        );
        output.video = videoOutput;
        model = "video-generation-complete";
        if (tracker) tracker.update("Complete", 100, "Video generation complete!");
        break;

      case "manga":
        if (tracker) tracker.update("Generating story", 10, "Creating manga story structure...");
        const mangaOutput = await generateManga({
          prompt: params.prompt,
          title: params.title,
          pages: params.mangaOptions?.pages || 10,
          style: params.mangaOptions?.style || "shonen",
        }, tracker);
        
        // Compile manga into production-ready formats (PDF, images, webtoon)
        if (tracker) tracker.update("Compiling", 90, "Creating downloadable formats...");
        try {
          const compiled = await compileManga(mangaOutput, "all");
          // Add compiled URLs to manga output
          mangaOutput.compiled = compiled;
        } catch (error) {
          console.error("Error compiling manga:", error);
          // Continue without compiled formats
        }
        
        output.manga = mangaOutput;
        model = "manga-generation-complete";
        if (tracker) tracker.update("Complete", 100, "Manga generation complete!");
        break;

      case "auto":
        // Auto-detect and generate
        const detectedType = detectContentType(params.prompt);
        return generateUnified({ ...params, contentType: detectedType });
    }

    const generationTime = (Date.now() - startTime) / 1000;

    return {
      contentType,
      title,
      prompt: params.prompt,
      output,
      metadata: {
        model,
        generationTime,
        tokensUsed,
      },
    };
  } catch (error) {
    console.error("Unified generation error:", error);
    throw new Error(
      `Failed to generate ${contentType}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
