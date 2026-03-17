import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";

/** A detected circular dependency between layers. */
export interface LayerCycle {
  /** Layer names forming the cycle, e.g. ["Infrastructure", "Lib", "Infrastructure"]. */
  cycle: string[];
  /** Import edges contributing to this cycle. */
  edges: CycleEdge[];
}

/** A single import edge participating in a cycle. */
export interface CycleEdge {
  source: string;
  target: string;
  sourceFile?: string;
  importPath?: string;
}

/**
 * Detect circular dependencies between layers using DFS.
 *
 * Builds a directed graph from inter-layer imports and finds all cycles.
 * This detects cycles that forbiddenImports alone would miss.
 *
 * @param extractions - All layer extraction results
 * @returns Detected cycles with contributing edges
 */
export function detectLayerCycles(extractions: LayerExtraction[]): LayerCycle[] {
  // Build adjacency list: source layer → Set<target layer>
  const graph = new Map<string, Set<string>>();
  // Track all edges per direction for reporting
  const edgeMap = new Map<string, CycleEdge[]>();

  for (const extraction of extractions) {
    if (!graph.has(extraction.layerName)) {
      graph.set(extraction.layerName, new Set());
    }

    for (const dep of extraction.dependencies) {
      if (dep.source === dep.target) continue; // skip self-references

      const sourceSet = graph.get(dep.source) ?? new Set();
      sourceSet.add(dep.target);
      graph.set(dep.source, sourceSet);

      const edgeKey = `${dep.source}->${dep.target}`;
      const edges = edgeMap.get(edgeKey) ?? [];
      edges.push({
        source: dep.source,
        target: dep.target,
        sourceFile: dep.sourceFile,
        importPath: dep.importPath,
      });
      edgeMap.set(edgeKey, edges);
    }
  }

  // Find all cycles using DFS
  const allCycles = findCycles(graph);

  // Deduplicate cycles (same set of layers in different rotation)
  const uniqueCycles = deduplicateCycles(allCycles);

  // Attach edge details to each cycle
  return uniqueCycles.map((cycle) => {
    const edges: CycleEdge[] = [];
    for (let i = 0; i < cycle.length - 1; i++) {
      const edgeKey = `${cycle[i]}->${cycle[i + 1]}`;
      const edgeList = edgeMap.get(edgeKey) ?? [];
      edges.push(...edgeList);
    }
    return { cycle, edges };
  });
}

/**
 * Find all elementary cycles in a directed graph using DFS.
 */
function findCycles(graph: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];
  const onStack = new Set<string>();

  function dfs(node: string): void {
    visited.add(node);
    stack.push(node);
    onStack.add(node);

    const neighbors = graph.get(node) ?? new Set();
    for (const neighbor of neighbors) {
      if (onStack.has(neighbor)) {
        // Found a cycle: extract from the start of the cycle in the stack
        const cycleStart = stack.indexOf(neighbor);
        const cycle = [...stack.slice(cycleStart), neighbor];
        cycles.push(cycle);
      } else if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }

    stack.pop();
    onStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Deduplicate cycles that represent the same set of layers in different rotations.
 * e.g. [A, B, C, A] and [B, C, A, B] are the same cycle.
 */
function deduplicateCycles(cycles: string[][]): string[][] {
  const seen = new Set<string>();
  const result: string[][] = [];

  for (const cycle of cycles) {
    // Normalize: get the inner nodes (without the repeated last), sort, and create a key
    const inner = cycle.slice(0, -1);
    const minIdx = inner.indexOf(inner.reduce((a, b) => (a < b ? a : b)));
    const rotated = [...inner.slice(minIdx), ...inner.slice(0, minIdx)];
    const key = rotated.join(" → ");

    if (!seen.has(key)) {
      seen.add(key);
      result.push(cycle);
    }
  }

  return result;
}
