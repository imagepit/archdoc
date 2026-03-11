export type LayerType =
  | "domain"
  | "application"
  | "presentation"
  | "infrastructure"
  | "custom";

export interface LayerConfig {
  name: string;
  nameJa: string;
  path: string;
  type: LayerType;
  description: string;
  responsibility: string;
  forbiddenImports: string[];
  categories: Record<string, string>;
}

export interface ProjectConfig {
  project: {
    name: string;
    description: string;
    sourceRoot: string;
  };
  layers: LayerConfig[];
}
