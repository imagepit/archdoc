import type { LayerExtraction } from "../types/extracted.js";
import type { LayerConfig } from "../types/config.js";

// --- Internal types ---

interface ProjectNode {
  name: string;
  layerName: string;
  kind: "class" | "interface" | "function";
}

interface ProjectRelationship {
  source: string;
  target: string;
  type: "extends" | "implements" | "dependency" | "association";
}

// Reuse color palette from dot-class-builder
const LAYER_COLORS = [
  { bg: "#e8eaf6", border: "#9fa8da" }, // indigo
  { bg: "#e8f5e9", border: "#a5d6a7" }, // green
  { bg: "#fff3e0", border: "#ffcc80" }, // orange
  { bg: "#fce4ec", border: "#ef9a9a" }, // pink
  { bg: "#e0f7fa", border: "#80deea" }, // cyan
  { bg: "#f3e5f5", border: "#ce93d8" }, // purple
];

// --- Public API ---

/**
 * Build a Mermaid classDiagram showing all objects across all layers.
 * Only cross-layer dependency violations are drawn as relationship lines.
 */
export function buildProjectOverviewMermaid(
  extractions: LayerExtraction[],
  layers?: LayerConfig[],
): string {
  const nodes = collectNodes(extractions);
  if (nodes.length === 0) return "";

  const nodeMap = new Map(nodes.map((n) => [n.name, n]));
  const relationships = collectRelationships(extractions, nodeMap);
  const allowedDeps = buildAllowedDependencyMap(extractions, layers);
  const violations = filterViolations(relationships, nodeMap, allowedDeps);

  const lines: string[] = ["classDiagram", "  direction LR"];

  // All nodes grouped by layer
  const layerGroups = groupByLayer(nodes);
  for (const [layerName, items] of layerGroups) {
    lines.push(`  namespace ${layerName} {`);
    for (const node of items) {
      if (node.kind === "interface") {
        lines.push(`    class ${node.name} {`);
        lines.push(`      <<interface>>`);
        lines.push(`    }`);
      } else if (node.kind === "function") {
        lines.push(`    class ${node.name} {`);
        lines.push(`      <<function>>`);
        lines.push(`    }`);
      } else {
        lines.push(`    class ${node.name}`);
      }
    }
    lines.push(`  }`);
  }

  // Only violation relationships
  for (const rel of violations) {
    switch (rel.type) {
      case "extends":
        lines.push(`  ${rel.target} <|-- ${rel.source}`);
        break;
      case "implements":
        lines.push(`  ${rel.target} <|.. ${rel.source}`);
        break;
      case "dependency":
        lines.push(`  ${rel.source} ..> ${rel.target}`);
        break;
      case "association":
        lines.push(`  ${rel.source} --> ${rel.target}`);
        break;
    }
  }

  return lines.join("\n");
}

/**
 * Build a DOT digraph showing all objects across all layers.
 * Only cross-layer dependency violations are drawn as relationship lines (in red).
 */
export function buildProjectOverviewDot(
  extractions: LayerExtraction[],
  layers?: LayerConfig[],
): string {
  const nodes = collectNodes(extractions);
  if (nodes.length === 0) return "";

  const nodeMap = new Map(nodes.map((n) => [n.name, n]));
  const relationships = collectRelationships(extractions, nodeMap);
  const allowedDeps = buildAllowedDependencyMap(extractions, layers);
  const violations = filterViolations(relationships, nodeMap, allowedDeps);

  const COLS = 3;

  const lines: string[] = [];
  lines.push("digraph {");
  lines.push("  rankdir=TB");
  lines.push("  newrank=true");
  lines.push("  compound=true");
  lines.push("  nodesep=0.3");
  lines.push("  ranksep=0.4");
  lines.push('  node [shape=box, style="rounded,filled", fillcolor=white, fontname="Helvetica", fontsize=11]');
  lines.push('  edge [fontname="Helvetica", fontsize=9, color="#d32f2f", fontcolor="#d32f2f"]');
  lines.push("");

  // All layer clusters with all nodes
  const layerGroups = groupByLayer(nodes);
  const layerAnchors: string[] = [];
  let colorIdx = 0;
  for (const [layerName, items] of layerGroups) {
    const color = LAYER_COLORS[colorIdx % LAYER_COLORS.length];
    colorIdx++;

    lines.push(`  subgraph cluster_${sanitizeId(layerName)} {`);
    lines.push(`    label="${escapeLabel(layerName)}"`);
    lines.push(`    style="rounded,filled"`);
    lines.push(`    color="${color.border}"`);
    lines.push(`    fillcolor="${color.bg}"`);
    lines.push(`    fontname="Helvetica Bold"`);
    lines.push(`    fontsize=13`);
    lines.push("");

    const nodeIds: string[] = [];
    for (const node of items) {
      const id = sanitizeId(node.name);
      nodeIds.push(id);
      if (node.kind === "interface") {
        const label = `\\<\\<interface\\>\\>\\n${escapeLabel(node.name)}`;
        lines.push(`    ${id} [label="${label}", style="rounded,filled,dashed"]`);
      } else if (node.kind === "function") {
        const label = `\\<\\<function\\>\\>\\n${escapeLabel(node.name)}`;
        lines.push(`    ${id} [label="${label}", shape=ellipse]`);
      } else {
        lines.push(`    ${id} [label="${escapeLabel(node.name)}"]`);
      }
    }

    // N-column grid within cluster
    if (nodeIds.length > COLS) {
      lines.push("");
      for (let r = 0; r < nodeIds.length; r += COLS) {
        const row = nodeIds.slice(r, r + COLS);
        lines.push(`    { rank=same; ${row.join("; ")} }`);
      }
      for (let r = 0; r + COLS < nodeIds.length; r += COLS) {
        lines.push(`    ${nodeIds[r]} -> ${nodeIds[r + COLS]} [style=invis]`);
      }
    }

    if (nodeIds.length > 0) {
      layerAnchors.push(nodeIds[0]);
    }

    lines.push("  }");
    lines.push("");
  }

  // Force vertical stacking of layers
  if (layerAnchors.length > 1) {
    for (let i = 0; i + 1 < layerAnchors.length; i++) {
      lines.push(`  ${layerAnchors[i]} -> ${layerAnchors[i + 1]} [style=invis]`);
    }
    lines.push("");
  }

  // Only violation relationships (drawn in red)
  if (violations.length > 0) {
    lines.push("  // Dependency violations");
    for (const rel of violations) {
      const src = sanitizeId(rel.source);
      const tgt = sanitizeId(rel.target);
      const srcLayer = nodeMap.get(rel.source)!.layerName;
      const tgtLayer = nodeMap.get(rel.target)!.layerName;
      const edgeLabel = `${srcLayer}→${tgtLayer}`;
      switch (rel.type) {
        case "extends":
          lines.push(`  ${src} -> ${tgt} [arrowhead=empty, label="${edgeLabel}"]`);
          break;
        case "implements":
          lines.push(`  ${src} -> ${tgt} [style=dashed, arrowhead=empty, label="${edgeLabel}"]`);
          break;
        case "dependency":
          lines.push(`  ${src} -> ${tgt} [style=dashed, arrowhead=vee, label="${edgeLabel}"]`);
          break;
        case "association":
          lines.push(`  ${src} -> ${tgt} [arrowhead=vee, label="${edgeLabel}"]`);
          break;
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

// --- Internal helpers ---

/**
 * Default allowed dependencies based on layer type (clean architecture).
 * Presentation → Application → Domain ← Infrastructure
 */
const DEFAULT_ALLOWED_BY_TYPE: Record<string, string[]> = {
  domain: [],
  application: ["domain"],
  infrastructure: ["domain"],
  presentation: ["application"],
};

/**
 * Build a map of allowed dependency targets for each layer.
 * Uses explicit `dependsOn` from config if provided, otherwise infers from layer type.
 * Returns the transitive closure (if A→B and B→C, then A→C is also allowed).
 */
function buildAllowedDependencyMap(
  extractions: LayerExtraction[],
  layers?: LayerConfig[],
): Map<string, Set<string>> {
  const layerNames = extractions.map((e) => e.layerName);
  const layerByName = layers
    ? new Map(layers.map((l) => [l.name, l]))
    : undefined;

  // Build direct allowed dependencies
  const directDeps = new Map<string, Set<string>>();
  for (const name of layerNames) {
    const config = layerByName?.get(name);
    if (config?.dependsOn) {
      directDeps.set(name, new Set(config.dependsOn));
    } else if (config) {
      const typeAllowed = DEFAULT_ALLOWED_BY_TYPE[config.type] ?? [];
      // Map type names to actual layer names
      const resolved = new Set<string>();
      for (const typeName of typeAllowed) {
        const target = layers?.find((l) => l.type === typeName);
        if (target) resolved.add(target.name);
      }
      directDeps.set(name, resolved);
    } else {
      // Fallback: allow depending on any earlier layer in extraction order
      const idx = layerNames.indexOf(name);
      directDeps.set(name, new Set(layerNames.slice(0, idx)));
    }
  }

  // Compute transitive closure
  const transitive = new Map<string, Set<string>>();
  for (const name of layerNames) {
    const reachable = new Set<string>();
    const queue = [...(directDeps.get(name) ?? [])];
    while (queue.length > 0) {
      const dep = queue.pop()!;
      if (reachable.has(dep)) continue;
      reachable.add(dep);
      for (const next of directDeps.get(dep) ?? []) {
        if (!reachable.has(next)) queue.push(next);
      }
    }
    transitive.set(name, reachable);
  }

  return transitive;
}

/**
 * Filter relationships to only include dependency violations.
 * A violation is a cross-layer dependency where the target layer
 * is NOT in the source layer's allowed dependency set.
 */
function filterViolations(
  relationships: ProjectRelationship[],
  nodeMap: Map<string, ProjectNode>,
  allowedDeps: Map<string, Set<string>>,
): ProjectRelationship[] {
  return relationships.filter((rel) => {
    const srcNode = nodeMap.get(rel.source);
    const tgtNode = nodeMap.get(rel.target);
    if (!srcNode || !tgtNode) return false;

    const srcLayer = srcNode.layerName;
    const tgtLayer = tgtNode.layerName;
    if (srcLayer === tgtLayer) return false;

    const allowed = allowedDeps.get(srcLayer);
    return !allowed || !allowed.has(tgtLayer);
  });
}

function collectNodes(extractions: LayerExtraction[]): ProjectNode[] {
  const nodes: ProjectNode[] = [];
  const seen = new Set<string>();

  for (const ext of extractions) {
    for (const cls of ext.classes) {
      if (!cls.isExported || seen.has(cls.name)) continue;
      seen.add(cls.name);
      nodes.push({ name: cls.name, layerName: ext.layerName, kind: "class" });
    }
    for (const iface of ext.interfaces) {
      if (!iface.isExported || seen.has(iface.name)) continue;
      seen.add(iface.name);
      nodes.push({ name: iface.name, layerName: ext.layerName, kind: "interface" });
    }
    for (const func of ext.functions) {
      if (!func.isExported || seen.has(func.name)) continue;
      seen.add(func.name);
      nodes.push({ name: func.name, layerName: ext.layerName, kind: "function" });
    }
  }

  return nodes;
}

function collectRelationships(
  extractions: LayerExtraction[],
  nodeMap: Map<string, ProjectNode>,
): ProjectRelationship[] {
  const relationships: ProjectRelationship[] = [];
  const seen = new Set<string>();

  const addRel = (source: string, target: string, type: ProjectRelationship["type"]) => {
    const key = `${source}->${target}`;
    if (seen.has(key)) return;
    if (!nodeMap.has(source) || !nodeMap.has(target)) return;
    seen.add(key);
    relationships.push({ source, target, type });
  };

  for (const ext of extractions) {
    // Class relationships
    for (const cls of ext.classes) {
      if (!cls.isExported) continue;

      if (cls.extendsClass) {
        addRel(cls.name, cls.extendsClass, "extends");
      }
      for (const impl of cls.implementsInterfaces) {
        addRel(cls.name, impl, "implements");
      }

      // Property type references
      for (const prop of cls.properties) {
        for (const [name] of nodeMap) {
          if (name === cls.name) continue;
          if (typeReferences(prop.type, name)) {
            addRel(cls.name, name, "association");
            break;
          }
        }
      }
    }

    // Interface relationships
    for (const iface of ext.interfaces) {
      if (!iface.isExported) continue;

      for (const ext2 of iface.extendsInterfaces) {
        addRel(iface.name, ext2, "extends");
      }

      // Interface property type references
      for (const prop of iface.properties) {
        for (const [name] of nodeMap) {
          if (name === iface.name) continue;
          if (typeReferences(prop.type, name)) {
            addRel(iface.name, name, "association");
            break;
          }
        }
      }

      // Interface method parameter/return type references
      for (const method of iface.methods) {
        for (const [name] of nodeMap) {
          if (name === iface.name) continue;
          if (typeReferences(method.returnType, name)) {
            addRel(iface.name, name, "dependency");
          }
          for (const param of method.parameters) {
            if (typeReferences(param.type, name)) {
              addRel(iface.name, name, "dependency");
            }
          }
        }
      }
    }

    // Function parameter type references
    for (const func of ext.functions) {
      if (!func.isExported) continue;
      for (const param of func.parameters) {
        for (const [name] of nodeMap) {
          if (name === func.name) continue;
          if (typeReferences(param.type, name)) {
            addRel(func.name, name, "dependency");
            break;
          }
        }
      }
    }

    // Constructor injection dependencies
    for (const chain of ext.callChains) {
      if (!nodeMap.has(chain.className)) continue;
      for (const dep of chain.constructorDeps) {
        addRel(chain.className, dep.typeName, "dependency");
      }
    }
  }

  return relationships;
}

function groupByLayer(nodes: ProjectNode[]): Map<string, ProjectNode[]> {
  const map = new Map<string, ProjectNode[]>();
  for (const node of nodes) {
    const items = map.get(node.layerName) ?? [];
    items.push(node);
    map.set(node.layerName, items);
  }
  return map;
}

/** Check if a type string references a given name (whole word match) */
function typeReferences(typeStr: string, name: string): boolean {
  const regex = new RegExp(`\\b${escapeRegex(name)}\\b`);
  return regex.test(typeStr);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeLabel(text: string): string {
  return text
    .replace(/"/g, '\\"')
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\|/g, "\\|");
}
