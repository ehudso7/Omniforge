# Unified Generation System - Suno-Style Production

OmniForge now operates like Suno and similar platforms where **a single prompt generates complete, production-ready content** across all modalities.

## Overview

The Unified Generation System takes a single user prompt and automatically:
1. **Analyzes** what types of content should be generated
2. **Orchestrates** multi-modal generation (text, images, audio, video)
3. **Produces** complete, production-ready outputs
4. **Saves** all assets to your project

## How It Works

### 1. Single Prompt Input
Users enter one prompt describing what they want to create:
```
"Create a short story about a robot learning to paint, with illustrations and an audio narration"
```

### 2. Intelligent Analysis
The AI analyzes the prompt to determine:
- What content types are needed (text, images, audio, video)
- The optimal generation strategy
- Content structure and format

### 3. Parallel Generation
The system generates all required content types in parallel:
- **Text**: Articles, stories, scripts, descriptions
- **Images**: Illustrations, visuals, concept art
- **Audio**: Speech narration, music, sound effects
- **Video**: Storyboards, frame-by-frame descriptions

### 4. Complete Production Output
All generated content is:
- Saved to your project
- Displayed in a unified interface
- Ready for immediate use or export

## Architecture

### Core Components

#### 1. Unified Generator Service (`lib/ai/unified-generator.ts`)
- Analyzes prompts to determine content strategy
- Orchestrates multi-modal generation
- Manages parallel execution
- Returns complete production output

#### 2. Unified API Endpoint (`app/api/generate/unified/route.ts`)
- Handles generation requests
- Validates project ownership
- Saves all generated assets
- Returns complete results

#### 3. Unified UI Component (`components/tools/unified-generator.tsx`)
- Single-prompt input interface
- Real-time generation progress
- Complete output display
- Asset management

#### 4. Updated Project Workspace
- "Unified Generator" tab (default)
- Individual modality tabs still available
- Seamless switching between views

## Usage

### Basic Usage

1. **Navigate to a Project**
   - Open any project from your dashboard

2. **Enter Your Prompt**
   - The Unified Generator tab is selected by default
   - Enter a descriptive prompt

3. **Generate**
   - Click "Generate Complete Production"
   - Watch as the AI creates all necessary content

4. **Review Results**
   - All generated content appears in organized sections
   - Download, export, or use immediately

### Example Prompts

**Story with Illustrations:**
```
"Write a children's story about a magical forest, include 2 illustrations and an audio narration"
```

**Article with Images:**
```
"Create an article about sustainable architecture with relevant images"
```

**Video Concept:**
```
"Generate a 30-second video storyboard about a day in the life of a coffee bean"
```

**Multimedia Project:**
```
"Create a complete multimedia presentation about space exploration with text, images, and audio"
```

## Features

### Auto-Detection
The system automatically determines what to generate based on your prompt:
- Mentions of "story", "article" → Text + Images
- Mentions of "song", "music" → Audio generation
- Mentions of "video", "film" → Video storyboard
- Complex prompts → Multi-modal generation

### Manual Control
You can also specify exactly what to generate:
```typescript
{
  prompt: "Your prompt here",
  options: {
    includeText: true,
    includeImages: true,
    includeAudio: false,
    includeVideo: false,
    autoDetect: false
  }
}
```

### Parallel Processing
All content types are generated simultaneously for faster results:
- Text generation runs while images are being created
- Audio can be generated from text content
- Video storyboards are created independently

### Production-Ready Output
- **Text**: Well-structured, publication-ready content
- **Images**: High-quality, optimized visuals
- **Audio**: Clear narration or music
- **Video**: Detailed storyboards with scripts

## Technical Details

### Prompt Analysis
The system uses GPT-4o-mini to analyze prompts and determine:
- Content type (article, story, song, video, multimedia)
- Required modalities
- Generation strategy
- Content structure

### Generation Flow
```
User Prompt
    ↓
Prompt Analysis (AI determines what to generate)
    ↓
Parallel Generation:
    ├─ Text Generation (if needed)
    ├─ Image Generation (if needed)
    ├─ Audio Generation (if needed)
    └─ Video Storyboard (if needed)
    ↓
Asset Creation & Storage
    ↓
Complete Production Output
```

### Error Handling
- Individual modality failures don't stop the entire process
- Partial results are saved and displayed
- Clear error messages for debugging

## Database Schema

The existing schema supports unified generation:
- Each asset type (TEXT, IMAGE, AUDIO, VIDEO) is stored separately
- All assets are linked to the same project
- Metadata includes generation context and relationships

## API Reference

### POST `/api/generate/unified`

**Request:**
```json
{
  "prompt": "Your creative prompt",
  "projectId": "project-id",
  "options": {
    "autoDetect": true,
    "includeText": true,
    "includeImages": true,
    "includeAudio": false,
    "includeVideo": false
  }
}
```

**Response:**
```json
{
  "result": {
    "id": "unified-1234567890",
    "prompt": "Your prompt",
    "generatedAt": "2024-01-01T00:00:00Z",
    "outputs": {
      "text": { ... },
      "images": [ ... ],
      "audio": { ... },
      "video": { ... }
    },
    "metadata": {
      "totalTokens": 5000,
      "generationTime": 15000,
      "models": ["gpt-4o-mini", "dall-e-3", "tts-1"]
    }
  },
  "assets": [ ... ],
  "message": "Production generated successfully"
}
```

## Benefits

### For Users
- **Simplicity**: One prompt, complete production
- **Speed**: Parallel generation saves time
- **Quality**: Production-ready outputs
- **Flexibility**: Still access individual tools if needed

### For Developers
- **Modular**: Easy to extend with new modalities
- **Scalable**: Parallel processing handles load
- **Maintainable**: Clear separation of concerns
- **Extensible**: Add new content types easily

## Future Enhancements

1. **Smart Templates**: Pre-configured generation patterns
2. **Style Presets**: Consistent styling across outputs
3. **Batch Generation**: Multiple productions from one prompt
4. **Collaboration**: Share and remix productions
5. **Export Formats**: Direct export to various platforms
6. **Quality Controls**: Fine-tune generation parameters
7. **Content Relationships**: Link related assets
8. **Version Control**: Track production iterations

## Migration Notes

### Existing Projects
- All existing projects work with the unified system
- Individual tools remain available
- No data migration required

### Backward Compatibility
- Individual generation endpoints still work
- Existing assets are unaffected
- Gradual migration path available

## Best Practices

### Writing Effective Prompts
1. **Be Specific**: Clear descriptions yield better results
2. **Include Context**: Mention desired style, tone, format
3. **Specify Modalities**: Explicitly mention what you want
4. **Use Examples**: Reference similar content if helpful

### Example Good Prompts
✅ "Create a 500-word article about renewable energy with 2 infographic-style images"
✅ "Write a children's bedtime story with 3 illustrations and a calm narration"
✅ "Generate a video storyboard for a 60-second product launch video"

### Example Less Effective Prompts
❌ "Make something cool" (too vague)
❌ "Article" (no context)
❌ "Everything" (unclear requirements)

## Troubleshooting

### Generation Takes Too Long
- Complex prompts generate more content
- Check your OpenAI API rate limits
- Consider breaking into smaller requests

### Missing Content Types
- Check prompt analysis results
- Verify API keys are configured
- Review error logs for specific failures

### Quality Issues
- Refine your prompt for clarity
- Use advanced options for fine-tuning
- Try different content type combinations

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2024
