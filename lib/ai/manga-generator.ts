import { generateText } from "./text-client";
import { generateImage } from "./image-client";
import { env } from "@/lib/env";

/**
 * Manga Generator - Creates complete, production-ready manga from a single prompt
 * Similar to how Suno creates complete songs, this creates complete manga pages
 */

export interface MangaGenerationParams {
  prompt: string;
  pages?: number; // Number of pages to generate (default: 3-5)
  style?: string; // Manga style (shonen, shojo, seinen, etc.)
}

export interface MangaPage {
  pageNumber: number;
  panels: Array<{
    panelNumber: number;
    description: string;
    imageUrl: string;
    dialogue?: string;
    narration?: string;
  }>;
  layout: "single" | "double" | "triple" | "quad";
}

export interface MangaProduction {
  id: string;
  title: string;
  synopsis: string;
  characters: Array<{
    name: string;
    description: string;
    designUrl?: string;
  }>;
  pages: MangaPage[];
  coverImage?: string;
  metadata: {
    totalPages: number;
    style: string;
    generatedAt: Date;
    generationTime: number;
  };
}

/**
 * Generates a complete manga production from a single prompt
 */
export async function generateMangaProduction(
  params: MangaGenerationParams
): Promise<MangaProduction> {
  const startTime = Date.now();
  const { prompt, pages = 5, style = "shonen" } = params;

  // Step 1: Generate complete manga concept and structure
  const conceptPrompt = `You are a professional manga creator. Create a complete, original manga based on this concept: "${prompt}"

Generate a complete manga production with:
1. Title (catchy and original)
2. Synopsis (2-3 sentences)
3. Main characters (3-5 characters with names and descriptions)
4. Story structure for ${pages} pages
5. Panel-by-panel breakdown for each page

Return ONLY a JSON object with this exact structure:
{
  "title": "Manga Title",
  "synopsis": "Brief synopsis...",
  "characters": [
    {
      "name": "Character Name",
      "description": "Detailed character description including appearance, personality, role"
    }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "layout": "double",
      "panels": [
        {
          "panelNumber": 1,
          "description": "Detailed visual description of what appears in this panel",
          "dialogue": "Character dialogue if any",
          "narration": "Narration text if any"
        }
      ]
    }
  ]
}

Make it production-ready, original, and complete. Each page should have 2-4 panels. Return ONLY valid JSON.`;

  let mangaStructure: any;
  try {
    const structureResult = await generateText({
      prompt: conceptPrompt,
      systemPrompt: "You are a professional manga creator. Create complete, original manga productions.",
      temperature: 0.8,
      maxTokens: 4000,
      model: "gpt-4o-mini",
    });

    // Parse the JSON structure
    const jsonMatch = structureResult.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      mangaStructure = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse manga structure");
    }
  } catch (error) {
    console.error("Failed to generate manga structure:", error);
    // Fallback structure
    mangaStructure = createFallbackStructure(prompt, pages);
  }

  // Step 2: Generate character designs
  const characterDesigns: Array<{ name: string; description: string; designUrl?: string }> = [];
  
  for (const character of mangaStructure.characters || []) {
    try {
      const designPrompt = `Character design for "${character.name}": ${character.description}. 
Manga style, full body character design, clean line art, professional manga illustration.`;
      
      const designResult = await generateImage({
        prompt: designPrompt,
        width: 1024,
        height: 1024,
        model: "dall-e-3",
      });

      characterDesigns.push({
        name: character.name,
        description: character.description,
        designUrl: designResult.url,
      });
    } catch (error) {
      console.error(`Failed to generate design for ${character.name}:`, error);
      characterDesigns.push({
        name: character.name,
        description: character.description,
      });
    }
  }

  // Step 3: Generate cover image
  let coverImage: string | undefined;
  try {
    const coverPrompt = `Manga cover art for "${mangaStructure.title}". 
${mangaStructure.synopsis}. 
Professional manga cover, dynamic composition, vibrant colors, ${style} style manga art.`;
    
    const coverResult = await generateImage({
      prompt: coverPrompt,
      width: 1024,
      height: 1024,
      model: "dall-e-3",
    });
    
    coverImage = coverResult.url;
  } catch (error) {
    console.error("Failed to generate cover:", error);
  }

  // Step 4: Generate all manga pages with panels
  const generatedPages: MangaPage[] = [];
  
  for (const pageData of mangaStructure.pages || []) {
    const panels: MangaPage["panels"] = [];
    
    // Generate images for each panel
    for (const panelData of pageData.panels || []) {
      try {
        const panelImagePrompt = `Manga panel illustration: ${panelData.description}. 
Professional manga art, ${style} style, black and white with screentones, dynamic composition, clear line art.`;
        
        const panelImage = await generateImage({
          prompt: panelImagePrompt,
          width: 1024,
          height: 1024,
          model: "dall-e-3",
        });

        panels.push({
          panelNumber: panelData.panelNumber || panels.length + 1,
          description: panelData.description,
          imageUrl: panelImage.url,
          dialogue: panelData.dialogue,
          narration: panelData.narration,
        });
      } catch (error) {
        console.error(`Failed to generate panel ${panelData.panelNumber}:`, error);
        // Continue with other panels
      }
    }

    if (panels.length > 0) {
      generatedPages.push({
        pageNumber: pageData.pageNumber || generatedPages.length + 1,
        panels,
        layout: pageData.layout || "double",
      });
    }
  }

  const generationTime = Date.now() - startTime;

  return {
    id: `manga-${Date.now()}`,
    title: mangaStructure.title || "Untitled Manga",
    synopsis: mangaStructure.synopsis || "",
    characters: characterDesigns,
    pages: generatedPages,
    coverImage,
    metadata: {
      totalPages: generatedPages.length,
      style,
      generatedAt: new Date(),
      generationTime,
    },
  };
}

/**
 * Creates a fallback structure if AI generation fails
 */
function createFallbackStructure(prompt: string, pages: number) {
  return {
    title: "Generated Manga",
    synopsis: `A manga based on: ${prompt}`,
    characters: [
      {
        name: "Main Character",
        description: "The protagonist of the story",
      },
    ],
    pages: Array.from({ length: pages }, (_, i) => ({
      pageNumber: i + 1,
      layout: "double",
      panels: [
        {
          panelNumber: 1,
          description: `Scene ${i + 1} panel 1: ${prompt}`,
          dialogue: "",
          narration: "",
        },
        {
          panelNumber: 2,
          description: `Scene ${i + 1} panel 2: continuation`,
          dialogue: "",
          narration: "",
        },
      ],
    })),
  };
}
