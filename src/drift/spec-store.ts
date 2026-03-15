import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { LayerExtraction } from "../types/extracted.js";

const STORE_DIR = ".archdoc";

/**
 * レイヤー抽出スナップショットをJSONファイルに保存する。
 * @param layerName - レイヤー名（ファイル名に使用）
 * @param extraction - 保存する抽出結果
 */
export function saveSpec(layerName: string, extraction: LayerExtraction): void {
  mkdirSync(STORE_DIR, { recursive: true });
  const filepath = join(STORE_DIR, `${layerName}.json`);
  writeFileSync(filepath, JSON.stringify(extraction, null, 2));
}

/**
 * 保存済みのレイヤー抽出スナップショットをJSONファイルから読み込む。
 * @param layerName - レイヤー名（ファイル名に使用）
 * @returns 抽出結果、またはファイルが存在しない/読み込み失敗時はnull
 */
export function loadSpec(layerName: string): LayerExtraction | null {
  const filepath = join(STORE_DIR, `${layerName}.json`);
  if (!existsSync(filepath)) return null;

  try {
    const content = readFileSync(filepath, "utf-8");
    return JSON.parse(content) as LayerExtraction;
  } catch {
    return null;
  }
}
