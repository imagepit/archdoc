import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { projectConfigSchema } from "./schema.js";
import { getDefaultCategories } from "./defaults.js";
import type { ProjectConfig } from "../types/config.js";

/**
 * layers.yamlファイルからプロジェクト設定を読み込みバリデーションする。
 * @param configPath - 設定ファイルのパス
 * @returns バリデーション済みのプロジェクト設定
 */
export function loadConfig(configPath: string = "layers.yaml"): ProjectConfig {
  let content: string;
  try {
    content = readFileSync(configPath, "utf-8");
  } catch {
    throw new Error(`Config file not found: ${configPath}`);
  }

  let raw: unknown;
  try {
    raw = yaml.load(content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid YAML in ${configPath}: ${msg}`);
  }

  const result = projectConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid config in ${configPath}:\n${issues}`);
  }

  const config = result.data as ProjectConfig;

  for (const layer of config.layers) {
    if (Object.keys(layer.categories).length === 0) {
      layer.categories = getDefaultCategories(layer.type);
    }
  }

  return config;
}
