import type { FrameworkExtractor } from "./framework-extractor.js";
import { ExpressExtractor } from "./express-extractor.js";

export type { FrameworkExtractor };

export function createFrameworkExtractor(
  framework?: string,
): FrameworkExtractor | null {
  if (framework === "express") return new ExpressExtractor();
  return null;
}
