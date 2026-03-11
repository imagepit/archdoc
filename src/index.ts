export { loadConfig } from "./config/loader.js";
export { createExtractorProject, extractLayer } from "./extractor/project.js";
export { generateIndexMd } from "./generator/index-generator.js";
export { generateLayerMd } from "./generator/layer-generator.js";
export { buildC4ComponentDiagram } from "./diagram/c4-builder.js";
export { buildDependencyGraph } from "./diagram/dependency-graph.js";
export { compareSpecs } from "./drift/spec-comparator.js";

export type { ProjectConfig, LayerConfig, LayerType } from "./types/config.js";
export type {
  ClassInfo,
  InterfaceInfo,
  FunctionInfo,
  MethodInfo,
  PropertyInfo,
  ParameterInfo,
  ThrowInfo,
  DependencyInfo,
  LayerExtraction,
} from "./types/extracted.js";
export type { DriftResult, SpecDiff, DriftSeverity } from "./types/drift.js";
