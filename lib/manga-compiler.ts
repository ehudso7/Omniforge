import { MangaResult } from "./ai/manga-generator";

export type CompilationFormat = NonNullable<
  MangaResult["compiled"]
>["format"];

type CompilationResult = NonNullable<MangaResult["compiled"]>;

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "manga";
}

/**
 * Stub compiler that returns structured placeholders for downstream rendering.
 * Real implementations can replace these URLs with actual asset locations.
 */
export async function compileManga(
  manga: MangaResult,
  format: CompilationFormat = "all"
): Promise<CompilationResult> {
  const slug = toSlug(manga.title);
  const basePath = `/manga/${slug}`;

  const result: CompilationResult = {
    format,
  };

  if (format === "pdf" || format === "all") {
    result.pdfUrl = `${basePath}/compiled.pdf`;
  }

  if (format === "images" || format === "all") {
    result.imageSequenceUrl = `${basePath}/panels.zip`;
  }

  if (format === "webtoon" || format === "all") {
    result.webtoonUrl = `${basePath}/webtoon.webp`;
  }

  // Simulate async work to mirror real compilation latency
  await new Promise((resolve) => setTimeout(resolve, 25));

  return result;
}
