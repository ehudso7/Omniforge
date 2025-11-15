export type AssetType = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";

export interface TextGenerationParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface TextGenerationResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  n?: number;
}

export interface ImageGenerationResult {
  url: string;
  revisedPrompt?: string;
  model: string;
}

export interface AudioGenerationParams {
  text: string;
  voice?: string;
  model?: string;
}

export interface AudioGenerationResult {
  url?: string;
  dataUrl?: string;
  model: string;
  duration?: number;
  format?: string;
  sizeBytes?: number;
}

export interface VideoStoryboardFrame {
  title: string;
  description: string;
  imageUrl?: string;
  duration?: number;
}

export interface VideoStoryboardParams {
  concept: string;
  numberOfFrames?: number;
  duration?: number;
}

export interface VideoStoryboardResult {
  script: string;
  frames: VideoStoryboardFrame[];
  totalDuration: number;
}
