import type { FrameworkExtractor } from "./framework-extractor.js";
import { ExpressExtractor } from "./express-extractor.js";

export type { FrameworkExtractor };

/**
 * レイヤー設定に基づいてFrameworkExtractorを生成するファクトリ関数。
 * @param framework - フレームワーク名（例: "express"）
 * @returns フレームワーク抽出器、または対応フレームワークがない場合はnull
 */
export function createFrameworkExtractor(
  framework?: string,
): FrameworkExtractor | null {
  if (framework === "express") return new ExpressExtractor();
  return null;
}
