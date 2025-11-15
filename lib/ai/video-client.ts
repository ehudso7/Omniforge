import { generateText } from "./text-client";
import {
  VideoStoryboardParams,
  VideoStoryboardResult,
  VideoStoryboardFrame,
} from "./types";

export async function generateStoryboard(
  params: VideoStoryboardParams
): Promise<VideoStoryboardResult> {
  const { concept, numberOfFrames = 5, duration = 30 } = params;

  const systemPrompt = `You are a professional storyboard creator and scriptwriter.
  Your task is to create detailed video storyboards with clear frame descriptions.
  Return your response as a JSON object with this exact structure:
  {
    "script": "Full narration script...",
    "frames": [
      {
        "title": "Frame title",
        "description": "Detailed visual description",
        "duration": number_in_seconds
      }
    ]
  }`;

  const prompt = `Create a ${numberOfFrames}-frame storyboard for a ${duration}-second video about: "${concept}"

  Each frame should have:
  - A clear, descriptive title
  - A detailed visual description (what we see on screen)
  - Duration in seconds (total should add up to ~${duration} seconds)

  Also write a complete script/narration for the video.

  Return ONLY valid JSON, no other text.`;

  try {
    const result = await generateText({
      prompt,
      systemPrompt,
      temperature: 0.8,
      maxTokens: 2000,
      model: "gpt-4o-mini",
    });

    // Parse the JSON response
    const parsed = JSON.parse(result.content);

    // Validate and format the response
    const frames: VideoStoryboardFrame[] = parsed.frames.map(
      (frame: any) => ({
        title: frame.title || "Untitled Frame",
        description: frame.description || "",
        duration: frame.duration || duration / numberOfFrames,
        imageUrl: undefined, // Could be populated later with generated images
      })
    );

    const totalDuration = frames.reduce(
      (sum, frame) => sum + (frame.duration || 0),
      0
    );

    return {
      script: parsed.script || "",
      frames,
      totalDuration,
    };
  } catch (error) {
    console.error("Storyboard generation error:", error);

    // Fallback to a structured storyboard if JSON parsing fails
    return createFallbackStoryboard(concept, numberOfFrames, duration);
  }
}

function createFallbackStoryboard(
  concept: string,
  numberOfFrames: number,
  duration: number
): VideoStoryboardResult {
  const frameDuration = duration / numberOfFrames;
  const frames: VideoStoryboardFrame[] = Array.from(
    { length: numberOfFrames },
    (_, i) => ({
      title: `Frame ${i + 1}`,
      description: `Scene ${i + 1} for: ${concept}`,
      duration: frameDuration,
    })
  );

  return {
    script: `This is a storyboard for: ${concept}`,
    frames,
    totalDuration: duration,
  };
}

/**
 * Generate complete production-ready video from storyboard
 * In production, this would integrate with RunwayML, Pika, Synthesia, etc.
 */
export async function generateVideo(params: {
  storyboard: VideoStoryboardResult;
  style?: string;
  concept: string;
}): Promise<{ url: string; duration: number; thumbnail?: string }> {
  const { storyboard, style = "cinematic", concept } = params;

  // In production, this would:
  // 1. Generate images for each frame using image generation API
  // 2. Generate narration/audio using text-to-speech
  // 3. Compile frames into video using video generation API
  // 4. Add transitions, effects, and production polish
  // 5. Return downloadable video file URL
  //
  // Example RunwayML integration (when available):
  // const runwayResponse = await fetch('https://api.runwayml.com/v1/generate', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${env.RUNWAY_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     prompt: concept,
  //     style,
  //     duration: storyboard.totalDuration,
  //     frames: storyboard.frames.map(f => ({
  //       description: f.description,
  //       duration: f.duration
  //     }))
  //   })
  // });
  // const videoData = await runwayResponse.json();
  // return {
  //   url: videoData.video_url,
  //   duration: videoData.duration,
  //   thumbnail: videoData.thumbnail_url
  // };

  console.log("Video generation requested:", { concept, style, duration: storyboard.totalDuration });

  return {
    url: "/api/video/placeholder", // Would be real video URL from RunwayML/API
    duration: storyboard.totalDuration,
    thumbnail: undefined, // Would be generated thumbnail
  };
}
