// Intelligent prompt analyzer - determines what content types to generate
// Inspired by Suno's single-prompt approach

import OpenAI from "openai";

export interface PromptAnalysis {
  primaryIntent: "story" | "marketing" | "educational" | "entertainment" | "product" | "general";
  contentTypes: {
    text: boolean;
    image: boolean;
    audio: boolean;
    video: boolean;
  };
  style: string;
  tone: string;
  targetAudience: string;
  suggestedFormats: {
    textFormat?: "article" | "script" | "blog" | "social" | "email" | "story";
    imageStyle?: string;
    audioType?: "narration" | "music" | "podcast" | "soundscape";
    videoStyle?: "cinematic" | "documentary" | "promotional" | "tutorial";
  };
  enhancedPrompts: {
    text?: string;
    image?: string;
    audio?: string;
    video?: string;
  };
}

export async function analyzePrompt(userPrompt: string): Promise<PromptAnalysis> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const analysisPrompt = `You are an AI content strategist. Analyze this user prompt and determine what types of content should be generated for a complete, production-ready output.

User Prompt: "${userPrompt}"

Respond in JSON format with this structure:
{
  "primaryIntent": "story|marketing|educational|entertainment|product|general",
  "contentTypes": {
    "text": true/false,
    "image": true/false,
    "audio": true/false,
    "video": false // set to false for now as we'll do storyboards
  },
  "style": "brief description of style",
  "tone": "professional|casual|creative|formal|inspirational",
  "targetAudience": "who this is for",
  "suggestedFormats": {
    "textFormat": "article|script|blog|social|email|story",
    "imageStyle": "photorealistic|illustration|abstract|minimal|vibrant",
    "audioType": "narration|music|podcast|soundscape"
  },
  "enhancedPrompts": {
    "text": "enhanced prompt for text generation",
    "image": "enhanced prompt for image generation (if needed)",
    "audio": "enhanced prompt for audio generation (if needed)"
  }
}

Be intelligent about what's needed. For example:
- A story needs text + images + possibly audio narration
- A product launch needs marketing copy + product images + promotional video storyboard
- Educational content needs clear text + diagrams + narration
- General creative prompts should generate complementary multi-modal content

Always generate at least 2 content types for a "production" feel.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert content strategist who understands how to create production-quality multi-modal content.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    // Ensure at least text is always generated
    if (!analysis.contentTypes.text && !analysis.contentTypes.image && !analysis.contentTypes.audio) {
      analysis.contentTypes.text = true;
      analysis.contentTypes.image = true;
    }

    return analysis as PromptAnalysis;
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    
    // Fallback analysis - generate text and image by default
    return {
      primaryIntent: "general",
      contentTypes: {
        text: true,
        image: true,
        audio: false,
        video: false,
      },
      style: "creative",
      tone: "professional",
      targetAudience: "general audience",
      suggestedFormats: {
        textFormat: "article",
        imageStyle: "photorealistic",
      },
      enhancedPrompts: {
        text: userPrompt,
        image: userPrompt,
      },
    };
  }
}
