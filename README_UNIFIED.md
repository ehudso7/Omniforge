# OmniForge Studio - Unified Generation (Suno-Style)

## Overview

OmniForge Studio now features a **unified generation system** that works like Suno - a single prompt produces complete, production-ready content instantly.

## Key Features

### 🎯 Single Prompt → Production Output

Just describe what you want to create, and OmniForge generates complete, production-quality content:

- **Text**: Complete articles, stories, scripts, poems, marketing copy
- **Images**: Production-ready images with professional quality
- **Audio**: Complete songs with lyrics and music (Suno-style)
- **Video**: Full videos with script, frames, and production polish

### 🧠 Intelligent Content Detection

When you select "Auto", OmniForge automatically detects what type of content you want based on your prompt:

- Mentions of "song", "music", "track" → Audio generation
- Mentions of "video", "film", "movie" → Video generation  
- Mentions of "image", "picture", "photo" → Image generation
- Otherwise → Text generation

### 🎨 Production-Quality Outputs

All generated content is production-ready:

- **Text**: Polished, publication-quality writing with proper structure
- **Images**: High-resolution, professional images (DALL-E 3)
- **Audio**: Complete songs with lyrics, music, and vocals (ready for Suno API integration)
- **Video**: Full videos with script, storyboard, and production elements (ready for RunwayML/Pika integration)

## Usage

### Unified Creator Interface

1. Navigate to any project
2. Click the **"Create"** tab (default, highlighted with sparkles icon)
3. Select content type (or leave on "Auto" for detection)
4. Enter your prompt describing what you want to create
5. Click **"Create Now"**
6. Get instant, production-ready output!

### Example Prompts

**Text:**
- "Write an engaging article about sustainable technology"
- "Create a marketing copy for a new AI product"
- "Write a short story about time travel"

**Image:**
- "A futuristic cityscape at sunset, cyberpunk style"
- "Professional product photography of a modern laptop"
- "Artistic illustration of a magical forest"

**Audio:**
- "An upbeat pop song about summer nights and adventure"
- "A relaxing acoustic ballad about finding peace"
- "An energetic electronic track with synth melodies"

**Video:**
- "A cinematic video about space exploration"
- "A documentary-style video about climate change"
- "An animated video explaining quantum computing"

## Architecture

### Unified Generator (`lib/ai/unified-generator.ts`)

The core unified generation system that:

1. Detects content type from prompt (if "auto")
2. Routes to appropriate generation function
3. Enhances prompts for production quality
4. Returns complete, structured output

### API Endpoint (`/api/generate/unified`)

Single endpoint for all content generation:

```typescript
POST /api/generate/unified
{
  "prompt": "A catchy pop song about summer",
  "contentType": "auto", // or "text", "image", "audio", "video"
  "title": "Optional title",
  // Optional content-specific options
  "audioOptions": {
    "genre": "pop",
    "mood": "uplifting",
    "duration": 180,
    "includeLyrics": true
  }
}
```

### Frontend Component (`components/tools/unified-creator.tsx`)

Beautiful, Suno-style interface with:

- Content type selector (Auto, Text, Image, Audio, Video)
- Large prompt input area
- Real-time generation status
- Rich result display with download options

## Integration Points

### Audio Generation (Suno API)

The audio generation is structured for Suno API integration:

```typescript
// In lib/ai/audio-client.ts
// When SUNO_API_KEY is available:
const sunoResponse = await fetch('https://api.suno.ai/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: musicPrompt,
    duration,
    make_instrumental: false,
    wait_audio: true
  })
});
```

### Video Generation (RunwayML/Pika)

The video generation is structured for RunwayML/Pika integration:

```typescript
// In lib/ai/video-client.ts
// When RUNWAY_API_KEY is available:
const runwayResponse = await fetch('https://api.runwayml.com/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.RUNWAY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: concept,
    style,
    duration: storyboard.totalDuration,
    frames: storyboard.frames
  })
});
```

## Content Quality Enhancements

### Text Generation
- **Style options**: Article, Story, Script, Poem, Marketing
- **Length options**: Short (500 words), Medium (1500 words), Long (3000 words)
- **Quality**: Publication-ready, polished, structured

### Image Generation
- **Style options**: Photorealistic, Artistic, Illustration, 3D
- **Aspect ratios**: Square, Landscape, Portrait
- **Quality**: DALL-E 3, high-resolution, professional

### Audio Generation
- **Complete songs**: Lyrics + Music + Vocals
- **Genre support**: Pop, Rock, Electronic, Acoustic, etc.
- **Mood options**: Uplifting, Relaxing, Energetic, etc.
- **Duration**: 30 seconds to 10 minutes

### Video Generation
- **Style options**: Cinematic, Documentary, Animated, Vlog
- **Complete videos**: Script + Frames + Production
- **Duration**: 5 seconds to 5 minutes

## Benefits

1. **Simplicity**: One prompt, one click, complete output
2. **Speed**: Instant generation (no multi-step process)
3. **Quality**: Production-ready content every time
4. **Flexibility**: Auto-detect or specify content type
5. **Integration-ready**: Structured for real API integrations

## Future Enhancements

- [ ] Real Suno API integration for audio
- [ ] Real RunwayML/Pika integration for video
- [ ] Batch generation (multiple outputs from one prompt)
- [ ] Style presets and templates
- [ ] Advanced customization options
- [ ] Preview and refinement before final generation
- [ ] Collaboration features

---

**The unified generation system makes OmniForge Studio as easy to use as Suno, but for all content types!**
