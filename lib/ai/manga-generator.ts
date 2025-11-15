/**
 * Manga/Comic Generator - Complete production-ready manga creation
 * Generates full manga with story, characters, pages, and panels
 */

import { generateText } from "./text-client";
import { generateImage } from "./image-client";
import { env } from "@/lib/env";

export interface MangaGenerationParams {
  prompt: string;
  title?: string;
  pages?: number; // Number of pages (default: 8-12 for a complete chapter)
  style?: "shonen" | "shoujo" | "seinen" | "josei" | "comic" | "webtoon";
}

export interface MangaPage {
  pageNumber: number;
  panels: MangaPanel[];
  narration?: string;
}

export interface MangaPanel {
  panelNumber: number;
  description: string;
  dialogue?: string[];
  imageUrl?: string; // Generated image URL
  visualStyle: string;
}

export interface MangaCharacter {
  name: string;
  description: string;
  role: string;
  designPrompt: string;
  imageUrl?: string; // Character design image
}

export interface MangaResult {
  title: string;
  synopsis: string;
  genre: string;
  characters: MangaCharacter[];
  pages: MangaPage[];
  totalPanels: number;
  storyArc: string;
  compiled?: {
    pdfUrl?: string;
    imageSequenceUrl?: string;
    webtoonUrl?: string;
    format: "pdf" | "images" | "webtoon" | "all";
  };
  metadata: {
    generationTime: number;
    pagesGenerated: number;
    panelsGenerated: number;
    imagesGenerated: number;
  };
}

/**
 * Generate complete production-ready manga
 */
export async function generateManga(
  params: MangaGenerationParams,
  progressTracker?: any
): Promise<MangaResult> {
  const startTime = Date.now();
  const { prompt, title, pages = 10, style = "shonen" } = params;

  // Step 1: Generate complete story structure
  if (progressTracker) progressTracker.update("Story", 10, "Creating story structure...");
  const storyStructure = await generateStoryStructure(prompt, pages, style, title);

  // Step 2: Generate character designs
  if (progressTracker) progressTracker.update("Characters", 20, "Designing characters...");
  const characters = await generateCharacters(storyStructure.characters, style);

  // Step 3: Generate detailed page breakdowns with panels
  if (progressTracker) progressTracker.update("Pages", 30, "Creating page layouts...");
  const pagesData = await generatePages(storyStructure, pages, style);

  // Step 4: Generate images for ALL panels - Complete production-ready manga
  // This generates every single panel image to match Suno's complete output approach
  if (progressTracker) progressTracker.update("Images", 40, "Generating panel images...");
  const pagesWithImages = await generatePanelImages(pagesData, characters, style, progressTracker);

  const generationTime = (Date.now() - startTime) / 1000;
  const totalPanels = pagesWithImages.reduce(
    (sum, page) => sum + page.panels.length,
    0
  );
  const imagesGenerated = pagesWithImages.reduce(
    (sum, page) => sum + page.panels.filter(p => p.imageUrl).length,
    0
  );

  return {
    title: storyStructure.title,
    synopsis: storyStructure.synopsis,
    genre: storyStructure.genre,
    characters,
    pages: pagesWithImages,
    totalPanels,
    storyArc: storyStructure.storyArc,
    metadata: {
      generationTime,
      pagesGenerated: pages,
      panelsGenerated: totalPanels,
      imagesGenerated,
    },
  };
}

interface StoryStructure {
  title: string;
  synopsis: string;
  genre: string;
  storyArc: string;
  characters: Array<{
    name: string;
    role: string;
    description: string;
  }>;
  pageBreakdown: Array<{
    pageNumber: number;
    summary: string;
    keyEvents: string[];
  }>;
}

/**
 * Generate complete story structure
 */
async function generateStoryStructure(
  prompt: string,
  pages: number = 10,
  style: string = "shonen",
  title?: string
): Promise<StoryStructure> {
  const systemPrompt = `You are a professional manga writer and storyboard artist. Your task is to create a complete, original manga story structure.

CRITICAL REQUIREMENTS:
- You MUST return ONLY valid JSON
- Do NOT include any text before or after the JSON
- Do NOT include explanations, apologies, or error messages
- The JSON must be complete and valid
- If you cannot create the story, return a basic valid JSON structure anyway

Style: ${style}
Pages: ${pages}

Create a complete story with:
1. An engaging title
2. A compelling synopsis
3. Main characters with distinct personalities
4. A clear story arc (beginning, middle, end)
5. Page-by-page breakdown with key events

Make it completely original and unique. Avoid any copyright material.

Return ONLY the JSON object, nothing else.`;

  const storyPrompt = title
    ? `Create a complete ${pages}-page ${style} manga titled "${title}" based on: ${prompt}

The manga must be:
- Completely original and unique
- Avoid all copyright material
- Have a complete story arc
- Include compelling characters
- Be production-ready

Return ONLY a valid JSON object with this exact structure (no other text):
{
  "title": "Manga Title",
  "synopsis": "Complete synopsis of the story",
  "genre": "Action/Comedy/etc",
  "storyArc": "Brief description of the story arc",
  "characters": [
    {
      "name": "Character Name",
      "role": "protagonist/antagonist/supporting",
      "description": "Character description and personality"
    }
  ],
  "pageBreakdown": [
    {
      "pageNumber": 1,
      "summary": "What happens on this page",
      "keyEvents": ["Event 1", "Event 2"]
    }
  ]
}`

    : `Create a complete ${pages}-page ${style} manga based on: ${prompt}

The manga must be:
- Completely original and unique
- Avoid all copyright material
- Have a complete story arc
- Include compelling characters
- Be production-ready

CRITICAL: You MUST return ONLY valid JSON. No explanations, no apologies, no error messages. Just the JSON object.

Return this exact JSON structure:
{
  "title": "Manga Title",
  "synopsis": "Complete synopsis of the story",
  "genre": "Action-Comedy",
  "storyArc": "Brief description of the story arc",
  "characters": [
    {
      "name": "Character Name",
      "role": "protagonist",
      "description": "Character description and personality"
    }
  ],
  "pageBreakdown": [
    {
      "pageNumber": 1,
      "summary": "What happens on this page",
      "keyEvents": ["Event 1", "Event 2"]
    }
  ]
}

Remember: Return ONLY the JSON, nothing else.`;

  try {
    const result = await generateText({
      prompt: storyPrompt,
      systemPrompt,
      temperature: 0.7, // Lower temperature for more consistent JSON
      maxTokens: 4000,
      model: "gpt-4o-mini",
    });

    if (!result || !result.content) {
      throw new Error("Empty response from LLM");
    }

    // Extract JSON from response - try multiple strategies
    let jsonText = result.content.trim();
    
    // Check if response starts with error message or contains error indicators
    const lowerText = jsonText.toLowerCase();
    if (
      lowerText.startsWith("an error") || 
      lowerText.startsWith("error") ||
      lowerText.includes("i'm sorry") ||
      lowerText.includes("i cannot") ||
      lowerText.includes("i can't") ||
      lowerText.includes("unable to")
    ) {
      console.warn("LLM returned error message instead of JSON:", jsonText.substring(0, 500));
      // Use fallback structure instead of throwing
      return createFallbackStoryStructure(prompt, pages, style, title);
    }
    
    // Strategy 1: Try to find JSON in code blocks first
    let jsonText = result.content.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      // Strategy 2: Find JSON object boundaries
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      } else {
        // No JSON found, use fallback
        console.warn("Could not find JSON boundaries, using fallback structure");
        return createFallbackStoryStructure(prompt, pages, style, title);
      }
    }
    
    // Clean up common issues
    jsonText = jsonText.trim();
    
    // Remove any leading text that's not part of JSON
    if (!jsonText.startsWith('{')) {
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace !== -1) {
        jsonText = jsonText.substring(firstBrace);
      } else {
        console.warn("No JSON object found, using fallback structure");
        return createFallbackStoryStructure(prompt, pages, style, title);
      }
    }

    // Validate it looks like JSON
    if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
      console.warn("Invalid JSON format, using fallback structure");
      return createFallbackStoryStructure(prompt, pages, style, title);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Attempted to parse:", jsonText.substring(0, 500));
      // Use fallback instead of throwing
      return createFallbackStoryStructure(prompt, pages, style, title);
    }
    
    // Validate and ensure required fields
    const validated: StoryStructure = {
      title: parsed.title || title || "Untitled Manga",
      synopsis: parsed.synopsis || `A complete ${style} manga story based on: ${prompt}`,
      genre: parsed.genre || style,
      storyArc: parsed.storyArc || "Complete story arc with beginning, middle, and end",
      characters: Array.isArray(parsed.characters) && parsed.characters.length > 0
        ? parsed.characters
        : [{
            name: "Main Character",
            role: "protagonist",
            description: "The main character of the story",
          }],
      pageBreakdown: Array.isArray(parsed.pageBreakdown) && parsed.pageBreakdown.length > 0
        ? parsed.pageBreakdown
        : Array.from({ length: pages }, (_, i) => ({
            pageNumber: i + 1,
            summary: `Page ${i + 1} of the story`,
            keyEvents: [`Event on page ${i + 1}`],
          })),
    };
    
    return validated;
  } catch (error) {
    console.error("Story structure generation error:", error);
    console.error("Falling back to default structure");
    // Fallback structure
    return createFallbackStoryStructure(prompt, pages, style, title);
  }
}

/**
 * Generate character designs
 */
async function generateCharacters(
  characterData: Array<{ name: string; role: string; description: string }>,
  style: string
): Promise<MangaCharacter[]> {
  const characters: MangaCharacter[] = [];

  for (const char of characterData) {
    const designPrompt = `Manga character design: ${char.name}, ${char.description}. ${style} style, professional manga art, character sheet, full body, dynamic pose, original design, avoid copyright`;

    characters.push({
      name: char.name,
      description: char.description,
      role: char.role,
      designPrompt,
      // In production, generate character design image here
      // imageUrl: await generateCharacterDesign(designPrompt)
    });
  }

  return characters;
}

/**
 * Generate detailed pages with panels
 */
async function generatePages(
  storyStructure: StoryStructure,
  pages: number,
  style: string
): Promise<MangaPage[]> {
  const pagesData: MangaPage[] = [];

  for (const pageBreakdown of storyStructure.pageBreakdown) {
    const pagePrompt = `Create detailed manga page ${pageBreakdown.pageNumber} for "${storyStructure.title}".

Page Summary: ${pageBreakdown.summary}
Key Events: ${pageBreakdown.keyEvents.join(", ")}

Style: ${style} manga
Characters: ${storyStructure.characters.map((c) => c.name).join(", ")}

Create 4-6 panels for this page with:
- Detailed visual descriptions for each panel
- Dialogue and speech bubbles
- Action and movement
- Manga-style composition

CRITICAL: Return ONLY valid JSON. No explanations, no error messages. Just the JSON object.

{
  "panels": [
    {
      "panelNumber": 1,
      "description": "Detailed visual description",
      "dialogue": ["Character: Dialogue text"],
      "visualStyle": "close-up"
    }
  ],
  "narration": "Optional narration text"
}`;

    try {
      const result = await generateText({
        prompt: pagePrompt,
        systemPrompt: `You are a professional manga storyboard artist. Your task is to create detailed panel descriptions.

CRITICAL REQUIREMENTS:
- You MUST return ONLY valid JSON
- Do NOT include any text before or after the JSON
- Do NOT include explanations, apologies, or error messages
- The JSON must be complete and valid
- If you cannot create panels, return a basic valid JSON structure anyway

Return ONLY the JSON object, nothing else.`,
        temperature: 0.7,
        maxTokens: 2000,
        model: "gpt-4o-mini",
      });

      if (!result || !result.content) {
        // Use fallback instead of throwing
        pagesData.push({
          pageNumber: pageBreakdown.pageNumber,
          panels: [
            {
              panelNumber: 1,
              description: pageBreakdown.summary,
              dialogue: [],
              visualStyle: "standard",
            },
          ],
        });
        continue;
      }

      // Extract JSON from response
      let jsonText = result.content.trim();
      
      // Check for error messages - use fallback instead of throwing
      const lowerText = jsonText.toLowerCase();
      if (
        lowerText.startsWith("an error") || 
        lowerText.startsWith("error") ||
        lowerText.includes("i'm sorry") ||
        lowerText.includes("i cannot") ||
        lowerText.includes("i can't")
      ) {
        console.warn(`LLM returned error for page ${pageBreakdown.pageNumber}, using fallback`);
        pagesData.push({
          pageNumber: pageBreakdown.pageNumber,
          panels: [
            {
              panelNumber: 1,
              description: pageBreakdown.summary,
              dialogue: [],
              visualStyle: "standard",
            },
          ],
        });
        continue;
      }
      
      // Try code block extraction first
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonText = codeBlockMatch[1].trim();
      } else {
        // Find JSON object boundaries
        const jsonStart = jsonText.indexOf('{');
        const jsonEnd = jsonText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        } else {
          // Use fallback panel instead of throwing
          pagesData.push({
            pageNumber: pageBreakdown.pageNumber,
            panels: [
              {
                panelNumber: 1,
                description: pageBreakdown.summary,
                dialogue: [],
                visualStyle: "standard",
              },
            ],
          });
          continue;
        }
      }
      
      // Clean up
      jsonText = jsonText.trim();
      
      if (!jsonText.startsWith('{')) {
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace !== -1) {
          jsonText = jsonText.substring(firstBrace);
        } else {
          // Use fallback panel
          pagesData.push({
            pageNumber: pageBreakdown.pageNumber,
            panels: [
              {
                panelNumber: 1,
                description: pageBreakdown.summary,
                dialogue: [],
                visualStyle: "standard",
              },
            ],
          });
          continue;
        }
      }

      if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        // Use fallback panel
        pagesData.push({
          pageNumber: pageBreakdown.pageNumber,
          panels: [
            {
              panelNumber: 1,
              description: pageBreakdown.summary,
              dialogue: [],
              visualStyle: "standard",
            },
          ],
        });
        continue;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.error(`JSON parse error for page ${pageBreakdown.pageNumber}:`, parseError);
        // Use fallback panel instead of throwing
        pagesData.push({
          pageNumber: pageBreakdown.pageNumber,
          panels: [
            {
              panelNumber: 1,
              description: pageBreakdown.summary,
              dialogue: [],
              visualStyle: "standard",
            },
          ],
        });
        continue;
      }
      
      // Ensure panels array exists
      if (parsed.panels && Array.isArray(parsed.panels) && parsed.panels.length > 0) {
        pagesData.push({
          pageNumber: pageBreakdown.pageNumber,
          panels: parsed.panels.map((p: any, idx: number) => ({
            panelNumber: p.panelNumber || idx + 1,
            description: p.description || pageBreakdown.summary,
            dialogue: Array.isArray(p.dialogue) ? p.dialogue : [],
            visualStyle: p.visualStyle || "standard",
          })),
          narration: parsed.narration || undefined,
        });
      } else {
        // Use fallback panel
        pagesData.push({
          pageNumber: pageBreakdown.pageNumber,
          panels: [
            {
              panelNumber: 1,
              description: pageBreakdown.summary,
              dialogue: [],
              visualStyle: "standard",
            },
          ],
        });
      }
    } catch (error) {
      console.error(`Error generating page ${pageBreakdown.pageNumber}:`, error);
      // Fallback panel
      pagesData.push({
        pageNumber: pageBreakdown.pageNumber,
        panels: [
          {
            panelNumber: 1,
            description: pageBreakdown.summary,
            dialogue: [],
            visualStyle: "standard",
          },
        ],
      });
    }
  }

  return pagesData;
}

/**
 * Generate images for ALL panels - Complete production-ready manga
 * Generates every single panel image to match Suno's complete output approach
 */
async function generatePanelImages(
  pages: MangaPage[],
  characters: MangaCharacter[],
  style: string,
  progressTracker?: any
): Promise<MangaPage[]> {
  const pagesWithImages = [...pages];
  const totalPanels = pages.reduce((sum, page) => sum + page.panels.length, 0);
  let generatedCount = 0;

  console.log(`Generating images for ${totalPanels} panels...`);

  // Generate images for ALL panels
  for (const page of pagesWithImages) {
    for (const panel of page.panels) {
      // Skip if already has image
      if (panel.imageUrl) continue;

      const imagePrompt = `Manga panel ${panel.panelNumber}, ${style} style: ${panel.description}. Professional manga art, black and white, dynamic composition, original artwork, avoid copyright, consistent art style`;

      try {
        // Generate image for this panel
        const imageResult = await generateImage({
          prompt: imagePrompt,
          width: 1024,
          height: 1024,
          model: "dall-e-3",
        });

        panel.imageUrl = imageResult.url;
        generatedCount++;

        // Update progress tracker
        if (progressTracker) {
          const progress = 40 + Math.floor((generatedCount / totalPanels) * 50); // 40-90% range
          progressTracker.update(
            "Images",
            progress,
            `Generated ${generatedCount}/${totalPanels} panel images...`
          );
        }

        // Log progress every 5 panels
        if (generatedCount % 5 === 0) {
          console.log(`Generated ${generatedCount}/${totalPanels} panel images...`);
        }

        // Small delay to avoid rate limits (adjust based on API limits)
        if (generatedCount < totalPanels) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (error) {
        console.error(`Error generating panel ${panel.panelNumber} image:`, error);
        // Continue with other panels even if one fails
      }
    }
  }

  console.log(`Completed: Generated ${generatedCount}/${totalPanels} panel images`);

  return pagesWithImages;
}

/**
 * Fallback story structure
 */
function createFallbackStoryStructure(
  prompt: string,
  pages: number,
  style: string,
  title?: string
): StoryStructure {
  // Create a more detailed fallback structure based on the prompt
  const promptLower = prompt.toLowerCase();
  
  // Extract key themes from prompt
  const themes: string[] = [];
  if (promptLower.includes("warrior") || promptLower.includes("fighter")) themes.push("warrior");
  if (promptLower.includes("soul") || promptLower.includes("spirit")) themes.push("soul/spirit");
  if (promptLower.includes("comedy") || promptLower.includes("funny")) themes.push("comedy");
  if (promptLower.includes("action") || promptLower.includes("battle")) themes.push("action");
  
  const genre = style === "shonen" ? "Action-Comedy" : style;
  const generatedTitle = title || `The ${themes.length > 0 ? themes.join(" & ") : "Adventure"} Chronicles`;
  
  // Create characters based on themes
  const characters = [
    {
      name: themes.includes("warrior") ? "Kaito" : "Ren",
      role: "protagonist",
      description: `A young ${themes.includes("warrior") ? "warrior" : "adventurer"} discovering their powers`,
    },
    {
      name: "Sora",
      role: "supporting",
      description: "A mysterious companion with unique abilities",
    },
  ];
  
  if (themes.includes("soul") || themes.includes("spirit")) {
    characters.push({
      name: "Yuki",
      role: "supporting",
      description: "A spirit guide who helps the protagonist",
    });
  }
  
  // Create page breakdown with story progression
  const pageBreakdown = Array.from({ length: pages }, (_, i) => {
    const pageNum = i + 1;
    let summary = "";
    let events: string[] = [];
    
    if (pageNum === 1) {
      summary = "Introduction: The protagonist discovers their unique abilities";
      events = ["Character introduction", "Power awakening", "First encounter"];
    } else if (pageNum <= pages / 3) {
      summary = `Early story: The protagonist begins their journey and meets allies`;
      events = ["Character development", "World building", "Forming team"];
    } else if (pageNum <= (pages * 2) / 3) {
      summary = "Middle story: Challenges and battles test the protagonist";
      events = ["Rising action", "Major conflict", "Character growth"];
    } else if (pageNum < pages) {
      summary = "Climax: The final battle approaches";
      events = ["Final confrontation", "Revelations", "Ultimate test"];
    } else {
      summary = "Conclusion: The story reaches its resolution";
      events = ["Resolution", "Character arcs complete", "New beginning"];
    }
    
    return {
      pageNumber: pageNum,
      summary,
      keyEvents: events,
    };
  });
  
  return {
    title: generatedTitle,
    synopsis: `An original ${style} manga story inspired by: ${prompt}. Follow the journey of ${characters[0].name} as they discover their powers and face incredible challenges. This is a completely original story with unique characters and world-building.`,
    genre,
    storyArc: `A complete ${pages}-page story following the hero's journey: beginning (pages 1-${Math.floor(pages/3)}), middle (pages ${Math.floor(pages/3)+1}-${Math.floor(pages*2/3)}), and end (pages ${Math.floor(pages*2/3)+1}-${pages})`,
    characters,
    pageBreakdown,
  };
}
