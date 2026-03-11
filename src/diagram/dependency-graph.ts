import type { ProjectConfig } from "../types/config.js";
import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";

export interface DependencyGraph {
  nodes: string[];
  edges: DependencyEdge[];
}

export interface DependencyEdge {
  source: string;
  target: string;
  count: number;
  isForbidden: boolean;
}

export function buildDependencyGraph(
  config: ProjectConfig,
  extractions: LayerExtraction[],
): DependencyGraph {
  const nodes = config.layers.map((l) => l.name);
  const edgeMap = new Map<string, DependencyEdge>();

  for (const extraction of extractions) {
    for (const dep of extraction.dependencies) {
      const key = `${dep.source}->${dep.target}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        const sourceLayer = config.layers.find((l) => l.name === dep.source);
        const targetLayer = config.layers.find((l) => l.name === dep.target);
        const isForbidden =
          sourceLayer?.forbiddenImports.some(
            (f) => targetLayer && (targetLayer.path === f || targetLayer.path.startsWith(f)),
          ) ?? false;

        edgeMap.set(key, {
          source: dep.source,
          target: dep.target,
          count: 1,
          isForbidden,
        });
      }
    }
  }

  return {
    nodes,
    edges: Array.from(edgeMap.values()),
  };
}
