import type { ProjectConfig } from "../types/config.js";
import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";

/** レイヤー間依存関係を表すグラフ構造。 */
export interface DependencyGraph {
  nodes: string[];
  edges: DependencyEdge[];
}

/** 依存関係グラフの単一有向辺。 */
export interface DependencyEdge {
  source: string;
  target: string;
  count: number;
  isForbidden: boolean;
}

/**
 * レイヤー抽出結果と設定から依存関係グラフを構築する。
 * @param config - プロジェクト設定
 * @param extractions - 全レイヤーの抽出結果
 * @returns 依存関係グラフ
 */
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
