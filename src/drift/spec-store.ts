import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { LayerExtraction } from "../types/extracted.js";

const STORE_DIR = ".archdoc";

export function saveSpec(layerName: string, extraction: LayerExtraction): void {
  mkdirSync(STORE_DIR, { recursive: true });
  const filepath = join(STORE_DIR, `${layerName}.json`);
  writeFileSync(filepath, JSON.stringify(extraction, null, 2));
}

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
