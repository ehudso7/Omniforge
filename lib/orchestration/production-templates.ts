// Production templates for different content types
// Each template defines what a COMPLETE production looks like

export type ProductionType = 
  | "manga"
  | "comic"
  | "music-video"
  | "podcast"
  | "documentary"
  | "marketing-campaign"
  | "educational-course"
  | "story"
  | "general";

export interface ProductionTemplate {
  type: ProductionType;
  components: ProductionComponent[];
  minAssets: number;
  requiresComplete: boolean;
}

export interface ProductionComponent {
  name: string;
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";
  required: boolean;
  count: number | "multiple"; // How many of this component
  description: string;
  prompt: string; // Template for prompt
}

export const PRODUCTION_TEMPLATES: Record<ProductionType, ProductionTemplate> = {
  manga: {
    type: "manga",
    requiresComplete: true,
    minAssets: 8,
    components: [
      {
        name: "Complete Story",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Full manga story with chapters, dialogue, narration",
        prompt: "Write a complete manga story with: opening scene, character introductions, rising action, climax, resolution. Include dialogue, narration, sound effects (SFX), and panel descriptions. Make it ready for illustration.",
      },
      {
        name: "Cover Art",
        type: "IMAGE",
        required: true,
        count: 1,
        description: "Professional manga cover illustration",
        prompt: "Professional manga cover art, dynamic composition, main characters in action, manga style, vibrant colors, dramatic lighting, Japanese manga aesthetic",
      },
      {
        name: "Main Character Design",
        type: "IMAGE",
        required: true,
        count: 1,
        description: "Protagonist character design sheet",
        prompt: "Manga character design sheet, protagonist, full body, multiple expressions, front and side view, anime manga style, detailed costume, professional character design",
      },
      {
        name: "Supporting Character Design",
        type: "IMAGE",
        required: true,
        count: 2,
        description: "Key supporting characters",
        prompt: "Manga character design sheet, {character_description}, full body, multiple expressions, anime manga style, detailed design, professional",
      },
      {
        name: "Key Scene Illustrations",
        type: "IMAGE",
        required: true,
        count: 3,
        description: "Major manga panels/scenes",
        prompt: "Manga panel illustration, {scene_description}, dynamic composition, manga style, dramatic angle, Japanese manga aesthetic, action scene",
      },
      {
        name: "Character Profiles",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Detailed character backgrounds and profiles",
        prompt: "Create detailed character profiles including: name, age, personality, background, abilities/powers, relationships, character arc, motivations",
      },
      {
        name: "World Building",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Setting and world details",
        prompt: "Create detailed world-building including: setting description, power system, society structure, important locations, rules of the world, history/lore",
      },
    ],
  },

  "music-video": {
    type: "music-video",
    requiresComplete: true,
    minAssets: 6,
    components: [
      {
        name: "Music Script",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Complete song with lyrics and music description",
        prompt: "Write complete song lyrics with verse, chorus, bridge. Include music description (tempo, instruments, genre), vocal style, and emotional tone.",
      },
      {
        name: "Storyboard",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Shot-by-shot video storyboard",
        prompt: "Create detailed music video storyboard: scene descriptions, camera angles, transitions, visual effects, timing with music, artistic direction.",
      },
      {
        name: "Key Frames",
        type: "IMAGE",
        required: true,
        count: 4,
        description: "Major scene illustrations",
        prompt: "Music video scene, {scene_description}, cinematic lighting, professional production quality, music video aesthetic",
      },
      {
        name: "Album Cover",
        type: "IMAGE",
        required: true,
        count: 1,
        description: "Professional album artwork",
        prompt: "Professional album cover art, {music_genre} style, striking visual, bold typography potential, music industry quality",
      },
    ],
  },

  podcast: {
    type: "podcast",
    requiresComplete: true,
    minAssets: 5,
    components: [
      {
        name: "Full Episode Script",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Complete podcast episode with segments",
        prompt: "Write complete podcast script with: intro, main segments, ad breaks, transitions, outro. Include timestamps, speaker notes, conversational tone.",
      },
      {
        name: "Show Notes",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Episode description and links",
        prompt: "Create podcast show notes: episode summary, key topics, timestamps, resources mentioned, guest info (if any), call-to-action.",
      },
      {
        name: "Cover Art",
        type: "IMAGE",
        required: true,
        count: 1,
        description: "Podcast cover artwork",
        prompt: "Professional podcast cover art, bold typography, striking visual, suitable for Spotify/Apple Podcasts, 3000x3000px quality",
      },
      {
        name: "Audiogram Scenes",
        type: "IMAGE",
        required: true,
        count: 3,
        description: "Social media promotional images",
        prompt: "Podcast audiogram visual, {highlight_quote}, professional design, social media ready, eye-catching",
      },
      {
        name: "Narration Script",
        type: "AUDIO",
        required: true,
        count: 1,
        description: "Voice-ready narration",
        prompt: "Format the podcast script for text-to-speech: proper pauses, emphasis marks, pronunciation guides, natural speech flow.",
      },
    ],
  },

  story: {
    type: "story",
    requiresComplete: true,
    minAssets: 6,
    components: [
      {
        name: "Complete Story",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Full narrative with beginning, middle, end",
        prompt: "Write a complete story with: compelling opening, character development, rising action, climax, resolution. Include dialogue, descriptions, and emotional depth. Make it publishable quality.",
      },
      {
        name: "Cover Illustration",
        type: "IMAGE",
        required: true,
        count: 1,
        description: "Story cover art",
        prompt: "Book cover illustration, {story_theme}, professional quality, captivating visual, suitable for publication",
      },
      {
        name: "Scene Illustrations",
        type: "IMAGE",
        required: true,
        count: 3,
        description: "Key moments visualized",
        prompt: "Story scene illustration, {scene_description}, artistic style matching genre, professional book illustration quality",
      },
      {
        name: "Character Descriptions",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Detailed character profiles",
        prompt: "Create detailed character profiles: physical appearance, personality, background, motivations, character arc, relationships",
      },
      {
        name: "Narration Script",
        type: "AUDIO",
        required: false,
        count: 1,
        description: "Audiobook-ready narration",
        prompt: "Format story for audiobook narration: proper pacing, character voices, emotional cues, pronunciation guides",
      },
    ],
  },

  "marketing-campaign": {
    type: "marketing-campaign",
    requiresComplete: true,
    minAssets: 8,
    components: [
      {
        name: "Campaign Strategy",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Complete marketing plan",
        prompt: "Create comprehensive marketing campaign: objectives, target audience, key messages, channels, timeline, success metrics, budget considerations",
      },
      {
        name: "Copy Package",
        type: "TEXT",
        required: true,
        count: 1,
        description: "All marketing copy",
        prompt: "Write complete copy package: social media posts (multiple variations), email campaign, landing page copy, ad copy, call-to-action variations",
      },
      {
        name: "Hero Image",
        type: "IMAGE",
        required: true,
        count: 1,
        description: "Main campaign visual",
        prompt: "Professional marketing hero image, {campaign_theme}, high-impact visual, brand-focused, advertising quality",
      },
      {
        name: "Social Media Assets",
        type: "IMAGE",
        required: true,
        count: 4,
        description: "Platform-specific images",
        prompt: "Social media graphic, {platform_specific}, engaging visual, on-brand, optimized dimensions, professional marketing design",
      },
      {
        name: "Product Showcase",
        type: "IMAGE",
        required: true,
        count: 1,
        description: "Product/service visualization",
        prompt: "Product photography style, {product_description}, professional lighting, marketing quality, lifestyle context",
      },
    ],
  },

  "educational-course": {
    type: "educational-course",
    requiresComplete: true,
    minAssets: 7,
    components: [
      {
        name: "Course Curriculum",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Complete course outline",
        prompt: "Create comprehensive course curriculum: learning objectives, module breakdown, lesson plans, activities, assessments, resources",
      },
      {
        name: "Lesson Content",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Full lesson materials",
        prompt: "Write detailed lesson content: explanations, examples, practice exercises, real-world applications, discussion questions",
      },
      {
        name: "Visual Aids",
        type: "IMAGE",
        required: true,
        count: 4,
        description: "Educational diagrams and illustrations",
        prompt: "Educational diagram, {concept_visualization}, clear and informative, professional design, suitable for learning",
      },
      {
        name: "Course Introduction",
        type: "AUDIO",
        required: true,
        count: 1,
        description: "Welcome and course overview narration",
        prompt: "Script engaging course introduction: welcome message, what students will learn, course structure, motivation, instructor voice",
      },
    ],
  },

  general: {
    type: "general",
    requiresComplete: false,
    minAssets: 3,
    components: [
      {
        name: "Main Content",
        type: "TEXT",
        required: true,
        count: 1,
        description: "Primary written content",
        prompt: "Create comprehensive written content based on the prompt",
      },
      {
        name: "Visual Assets",
        type: "IMAGE",
        required: true,
        count: 2,
        description: "Complementary images",
        prompt: "Create relevant visual content",
      },
    ],
  },
};

export function detectProductionType(prompt: string): ProductionType {
  const lowerPrompt = prompt.toLowerCase();

  // Manga/Comic detection
  if (
    lowerPrompt.includes("manga") ||
    lowerPrompt.includes("comic") ||
    lowerPrompt.includes("graphic novel") ||
    (lowerPrompt.includes("bleach") && lowerPrompt.includes("soul eater")) ||
    lowerPrompt.includes("anime story")
  ) {
    return "manga";
  }

  // Music video detection
  if (
    lowerPrompt.includes("music video") ||
    lowerPrompt.includes("song with video") ||
    (lowerPrompt.includes("music") && lowerPrompt.includes("visual"))
  ) {
    return "music-video";
  }

  // Podcast detection
  if (
    lowerPrompt.includes("podcast") ||
    lowerPrompt.includes("audio episode") ||
    lowerPrompt.includes("interview show")
  ) {
    return "podcast";
  }

  // Marketing detection
  if (
    lowerPrompt.includes("marketing campaign") ||
    lowerPrompt.includes("product launch") ||
    lowerPrompt.includes("brand campaign") ||
    (lowerPrompt.includes("promote") && lowerPrompt.includes("brand"))
  ) {
    return "marketing-campaign";
  }

  // Educational detection
  if (
    lowerPrompt.includes("course") ||
    lowerPrompt.includes("lesson") ||
    lowerPrompt.includes("teach") ||
    lowerPrompt.includes("educational")
  ) {
    return "educational-course";
  }

  // Story detection
  if (
    lowerPrompt.includes("story") ||
    lowerPrompt.includes("tale") ||
    lowerPrompt.includes("narrative") ||
    lowerPrompt.includes("novel")
  ) {
    return "story";
  }

  return "general";
}
