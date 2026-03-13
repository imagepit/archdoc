export type LayerType =
  | "domain"
  | "application"
  | "presentation"
  | "infrastructure"
  | "custom";

export interface CategoryOverride {
  pattern: string;
  category: string;
}

export interface LayerConfig {
  name: string;
  nameJa: string;
  path: string;
  type: LayerType;
  description: string;
  responsibility: string;
  forbiddenImports: string[];
  categories: Record<string, string>;
  /** Allowed dependency targets (layer names). If omitted, inferred from type. */
  dependsOn?: string[];
  /** Name-pattern-based category overrides applied after directory-based resolution */
  categoryOverrides?: CategoryOverride[];
  /** Framework identifier for framework-specific extraction (e.g. "express") */
  framework?: string;
}

export interface ProjectConfig {
  project: {
    name: string;
    description: string;
    sourceRoot: string;
  };
  layers: LayerConfig[];
}
