import { generateMangaProduction, MangaProduction } from "./manga-generator";
import { generateText } from "./text-client";
import { generateImage } from "./image-client";
import { generateSpeech } from "./audio-client";
import { generateStoryboard } from "./video-client";

/**
 * Production Generator - Creates complete, finished productions from prompts
 * Similar to Suno's approach: one prompt = one complete, polished product
 */

export interface ProductionParams {
  prompt: string;
  productionType?: "auto" | "manga" | "article" | "story" | "video" | "multimedia";
}

export interface CompleteProduction {
  id: string;
  type: "manga" | "article" | "story" | "video" | "multimedia";
  title: string;
  prompt: string;
  generatedAt: Date;
  production: MangaProduction | ArticleProduction | StoryProduction | VideoProduction | MultimediaProduction;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface ArticleProduction {
  title: string;
  content: string;
  images: Array<{ url: string; caption: string }>;
  metadata: {
    wordCount: number;
    readingTime: number;
  };
}

export interface StoryProduction {
  title: string;
  content: string;
  coverImage?: string;
  illustrations: Array<{ url: string; page: number }>;
  audioNarration?: { url: string; duration: number };
}

export interface VideoProduction {
  title: string;
  storyboard: {
    script: string;
    frames: Array<{
      title: string;
      description: string;
      imageUrl?: string;
      duration: number;
    }>;
  };
  previewVideo?: { url: string };
}

export interface MultimediaProduction {
  title: string;
  components: {
    text?: { content: string };
    images?: Array<{ url: string; description: string }>;
    audio?: { url: string; duration: number };
    video?: { storyboard: any };
  };
}

/**
 * Detects production type from prompt
 */
async function detectProductionType(prompt: string): Promise<string> {
  const detectionPrompt = `Analyze this prompt and determine the production type. Return ONLY one word: manga, article, story, video, or multimedia.

Prompt: "${prompt}"`;

  try {
    const result = await generateText({
      prompt: detectionPrompt,
      systemPrompt: "You are a content type classifier.",
      temperature: 0.3,
      maxTokens: 10,
      model: "gpt-4o-mini",
    });

    const detected = result.content.toLowerCase().trim();
    if (["manga", "article", "story", "video", "multimedia"].includes(detected)) {
      return detected;
    }
  } catch (error) {
    console.error("Production type detection failed:", error);
  }

  // Default detection based on keywords
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes("manga") || lowerPrompt.includes("comic")) {
    return "manga";
  }
  if (lowerPrompt.includes("article") || lowerPrompt.includes("blog")) {
    return "article";
  }
  if (lowerPrompt.includes("story") || lowerPrompt.includes("tale")) {
    return "story";
  }
  if (lowerPrompt.includes("video") || lowerPrompt.includes("film")) {
    return "video";
  }
  return "multimedia";
}

/**
 * Generates a complete, finished production from a prompt
 */
export async function generateCompleteProduction(
  params: ProductionParams
): Promise<CompleteProduction> {
  const { prompt, productionType = "auto" } = params;

  // Detect production type if auto
  const type = productionType === "auto" 
    ? await detectProductionType(prompt)
    : productionType;

  let production: any;
  let title = "";

  switch (type) {
    case "manga":
      const manga = await generateMangaProduction({ prompt });
      production = manga;
      title = manga.title;
      break;

    case "article":
      const article = await generateArticleProduction(prompt);
      production = article;
      title = article.title;
      break;

    case "story":
      const story = await generateStoryProduction(prompt);
      production = story;
      title = story.title;
      break;

    case "video":
      const video = await generateVideoProduction(prompt);
      production = video;
      title = video.title;
      break;

    default:
      const multimedia = await generateMultimediaProduction(prompt);
      production = multimedia;
      title = multimedia.title;
  }

  return {
    id: `production-${Date.now()}`,
    type: type as any,
    title,
    prompt,
    generatedAt: new Date(),
    production,
  };
}

/**
 * Generates a complete article production
 */
async function generateArticleProduction(prompt: string): Promise<ArticleProduction> {
  // Generate article content
  const articleResult = await generateText({
    prompt: `Write a complete, publication-ready article about: ${prompt}`,
    systemPrompt: "You are a professional journalist. Write engaging, well-structured articles.",
    temperature: 0.7,
    maxTokens: 2000,
    model: "gpt-4o-mini",
  });

  // Extract title
  const titleMatch = articleResult.content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : extractTitle(articleResult.content) || "Article";

  // Generate 2-3 relevant images
  const images: Array<{ url: string; caption: string }> = [];
  for (let i = 0; i < 2; i++) {
    try {
      const imageResult = await generateImage({
        prompt: `${prompt} - professional article illustration ${i + 1}`,
        width: 1024,
        height: 1024,
        model: "dall-e-3",
      });
      images.push({
        url: imageResult.url,
        caption: imageResult.revisedPrompt || `Illustration ${i + 1}`,
      });
    } catch (error) {
      console.error("Failed to generate article image:", error);
    }
  }

  const wordCount = articleResult.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return {
    title,
    content: articleResult.content,
    images,
    metadata: {
      wordCount,
      readingTime,
    },
  };
}

/**
 * Generates a complete story production
 */
async function generateStoryProduction(prompt: string): Promise<StoryProduction> {
  // Generate story
  const storyResult = await generateText({
    prompt: `Write a complete, engaging story: ${prompt}`,
    systemPrompt: "You are a professional storyteller. Write compelling, well-structured stories.",
    temperature: 0.8,
    maxTokens: 2000,
    model: "gpt-4o-mini",
  });

  const title = extractTitle(storyResult.content) || "Story";

  // Generate cover image
  let coverImage: string | undefined;
  try {
    const coverResult = await generateImage({
      prompt: `Book cover illustration for "${title}": ${prompt}. Professional book cover art.`,
      width: 1024,
      height: 1024,
      model: "dall-e-3",
    });
    coverImage = coverResult.url;
  } catch (error) {
    console.error("Failed to generate cover:", error);
  }

  // Generate 2-3 illustrations
  const illustrations: Array<{ url: string; page: number }> = [];
  for (let i = 0; i < 2; i++) {
    try {
      const illResult = await generateImage({
        prompt: `Story illustration: ${prompt}. Professional illustration, book style.`,
        width: 1024,
        height: 1024,
        model: "dall-e-3",
      });
      illustrations.push({
        url: illResult.url,
        page: i + 1,
      });
    } catch (error) {
      console.error("Failed to generate illustration:", error);
    }
  }

  // Generate audio narration
  let audioNarration: { url: string; duration: number } | undefined;
  try {
    const narrationText = storyResult.content.substring(0, 1000);
    const audioResult = await generateSpeech({
      text: narrationText,
      voice: "alloy",
      model: "tts-1",
    });
    audioNarration = {
      url: audioResult.url,
      duration: audioResult.duration || 30,
    };
  } catch (error) {
    console.error("Failed to generate narration:", error);
  }

  return {
    title,
    content: storyResult.content,
    coverImage,
    illustrations,
    audioNarration,
  };
}

/**
 * Generates a complete video production
 */
async function generateVideoProduction(prompt: string): Promise<VideoProduction> {
  const storyboard = await generateStoryboard({
    concept: prompt,
    numberOfFrames: 5,
    duration: 30,
  });

  const title = extractTitle(storyboard.script) || "Video Production";

  return {
    title,
    storyboard: {
      script: storyboard.script,
      frames: storyboard.frames.map((frame) => ({
        title: frame.title,
        description: frame.description,
        imageUrl: frame.imageUrl,
        duration: frame.duration || 0,
      })),
    },
  };
}

/**
 * Generates a complete multimedia production
 */
async function generateMultimediaProduction(prompt: string): Promise<MultimediaProduction> {
  const [textResult, imageResult] = await Promise.all([
    generateText({
      prompt: `Create complete content about: ${prompt}`,
      systemPrompt: "You are a professional content creator.",
      temperature: 0.7,
      maxTokens: 1500,
      model: "gpt-4o-mini",
    }),
    generateImage({
      prompt: `${prompt} - professional illustration`,
      width: 1024,
      height: 1024,
      model: "dall-e-3",
    }),
  ]);

  const title = extractTitle(textResult.content) || "Multimedia Production";

  return {
    title,
    components: {
      text: { content: textResult.content },
      images: [{ url: imageResult.url, description: imageResult.revisedPrompt || "" }],
    },
  };
}

function extractTitle(content: string): string | null {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length > 0 && firstLine.length < 100) {
    return firstLine;
  }
  
  return null;
}
