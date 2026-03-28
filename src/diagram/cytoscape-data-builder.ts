import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";
import type { ProjectConfig, LayerConfig } from "../types/config.js";

// --- Public types ---

export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    parent?: string;
    kind: string;
    category: string;
    layer: string;
    filePath: string;
    description: string;
    dddRole?: string;
  };
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    type: string;
    isForbidden: boolean;
    count?: number;
    sourceFile?: string;
    importPath?: string;
  };
}

export interface CytoscapeElements {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}

// --- Layer color palette (reused from project-overview-builder) ---

const LAYER_COLORS = [
  { bg: "#e8eaf6", border: "#9fa8da" },
  { bg: "#e8f5e9", border: "#a5d6a7" },
  { bg: "#fff3e0", border: "#ffcc80" },
  { bg: "#fce4ec", border: "#ef9a9a" },
  { bg: "#e0f7fa", border: "#80deea" },
  { bg: "#f3e5f5", border: "#ce93d8" },
];

export { LAYER_COLORS as CYTOSCAPE_LAYER_COLORS };

// --- Public API ---

/**
 * Build Cytoscape.js elements JSON from archdoc extraction data.
 * @param config - Project configuration
 * @param extractions - All layer extraction results
 * @returns Cytoscape.js compatible elements
 */
export function buildCytoscapeElements(
  config: ProjectConfig,
  extractions: LayerExtraction[],
): CytoscapeElements {
  const nodes: CytoscapeNode[] = [];
  const edges: CytoscapeEdge[] = [];
  const seen = new Set<string>();

  // Create layer group (compound) nodes
  for (let i = 0; i < config.layers.length; i++) {
    const layer = config.layers[i];
    const color = LAYER_COLORS[i % LAYER_COLORS.length];
    nodes.push({
      data: {
        id: `layer:${layer.name}`,
        label: `${layer.name} (${layer.nameJa})`,
        kind: "layer",
        category: "",
        layer: layer.name,
        filePath: layer.path,
        description: layer.responsibility,
      },
    });
  }

  // Collect component nodes from extractions
  for (const ext of extractions) {
    const parentId = `layer:${ext.layerName}`;

    for (const cls of ext.classes) {
      if (!cls.isExported || seen.has(cls.name)) continue;
      seen.add(cls.name);
      nodes.push({
        data: {
          id: cls.name,
          label: cls.name,
          parent: parentId,
          kind: "class",
          category: cls.category,
          layer: ext.layerName,
          filePath: cls.filePath,
          description: firstLine(cls.description),
          dddRole: cls.dddRole,
        },
      });
    }

    for (const iface of ext.interfaces) {
      if (!iface.isExported || seen.has(iface.name)) continue;
      seen.add(iface.name);
      nodes.push({
        data: {
          id: iface.name,
          label: iface.name,
          parent: parentId,
          kind: "interface",
          category: iface.category,
          layer: ext.layerName,
          filePath: iface.filePath,
          description: firstLine(iface.description),
          dddRole: iface.dddRole,
        },
      });
    }

    for (const func of ext.functions) {
      if (!func.isExported || seen.has(func.name)) continue;
      seen.add(func.name);
      nodes.push({
        data: {
          id: func.name,
          label: func.name,
          parent: parentId,
          kind: "function",
          category: func.category,
          layer: ext.layerName,
          filePath: func.filePath,
          description: firstLine(func.description),
        },
      });
    }

    for (const ta of ext.typeAliases) {
      if (!ta.isExported || seen.has(ta.name)) continue;
      seen.add(ta.name);
      nodes.push({
        data: {
          id: ta.name,
          label: ta.name,
          parent: parentId,
          kind: "type",
          category: ta.category,
          layer: ext.layerName,
          filePath: ta.filePath,
          description: firstLine(ta.description),
        },
      });
    }

    for (const en of ext.enums) {
      if (!en.isExported || seen.has(en.name)) continue;
      seen.add(en.name);
      nodes.push({
        data: {
          id: en.name,
          label: en.name,
          parent: parentId,
          kind: "enum",
          category: en.category,
          layer: ext.layerName,
          filePath: en.filePath,
          description: firstLine(en.description),
        },
      });
    }

    for (const c of ext.constants) {
      if (!c.isExported || seen.has(c.name)) continue;
      seen.add(c.name);
      nodes.push({
        data: {
          id: c.name,
          label: c.name,
          parent: parentId,
          kind: "const",
          category: c.category,
          layer: ext.layerName,
          filePath: c.filePath,
          description: firstLine(c.description),
        },
      });
    }
  }

  // Collect relationship edges
  const edgeSeen = new Set<string>();
  let edgeCounter = 0;

  const addEdge = (
    source: string,
    target: string,
    type: string,
    isForbidden: boolean,
    extra?: { count?: number; sourceFile?: string; importPath?: string },
  ) => {
    const key = `${source}->${target}:${type}`;
    if (edgeSeen.has(key)) return;
    if (!seen.has(source) || !seen.has(target)) return;
    edgeSeen.add(key);
    edgeCounter++;
    edges.push({
      data: {
        id: `e${edgeCounter}`,
        source,
        target,
        type,
        isForbidden,
        ...extra,
      },
    });
  };

  // Build a node lookup map for type reference matching
  const nodeNames = new Set(seen);

  for (const ext of extractions) {
    // --- Class relationships ---
    for (const cls of ext.classes) {
      if (!cls.isExported) continue;

      // extends / implements
      if (cls.extendsClass) {
        addEdge(cls.name, cls.extendsClass, "extends", false);
      }
      for (const impl of cls.implementsInterfaces) {
        addEdge(cls.name, impl, "implements", false);
      }

      // Property type references → association
      for (const prop of cls.properties) {
        for (const name of nodeNames) {
          if (name === cls.name) continue;
          if (typeReferences(prop.type, name)) {
            addEdge(cls.name, name, "association", false);
          }
        }
      }

      // Method parameter & return type references → dependency
      for (const method of cls.methods) {
        for (const name of nodeNames) {
          if (name === cls.name) continue;
          if (typeReferences(method.returnType, name)) {
            addEdge(cls.name, name, "dependency", false);
          }
          for (const param of method.parameters) {
            if (typeReferences(param.type, name)) {
              addEdge(cls.name, name, "dependency", false);
            }
          }
        }
      }
    }

    // --- Interface relationships ---
    for (const iface of ext.interfaces) {
      if (!iface.isExported) continue;

      for (const ext2 of iface.extendsInterfaces) {
        addEdge(iface.name, ext2, "extends", false);
      }

      // Property type references → association
      for (const prop of iface.properties) {
        for (const name of nodeNames) {
          if (name === iface.name) continue;
          if (typeReferences(prop.type, name)) {
            addEdge(iface.name, name, "association", false);
          }
        }
      }

      // Method parameter & return type references → dependency
      for (const method of iface.methods) {
        for (const name of nodeNames) {
          if (name === iface.name) continue;
          if (typeReferences(method.returnType, name)) {
            addEdge(iface.name, name, "dependency", false);
          }
          for (const param of method.parameters) {
            if (typeReferences(param.type, name)) {
              addEdge(iface.name, name, "dependency", false);
            }
          }
        }
      }
    }

    // --- Function parameter & return type references ---
    for (const func of ext.functions) {
      if (!func.isExported) continue;
      for (const name of nodeNames) {
        if (name === func.name) continue;
        if (typeReferences(func.returnType, name)) {
          addEdge(func.name, name, "dependency", false);
        }
        for (const param of func.parameters) {
          if (typeReferences(param.type, name)) {
            addEdge(func.name, name, "dependency", false);
          }
        }
      }
    }

    // --- Constructor injection dependencies ---
    for (const chain of ext.callChains) {
      if (!nodeNames.has(chain.className)) continue;
      for (const dep of chain.constructorDeps) {
        addEdge(chain.className, dep.typeName, "dependency", false);
      }
    }
  }

  // Import-level forbidden violations (layer-to-layer)
  const forbiddenMap = new Map<string, { count: number; details: DependencyInfo[] }>();
  for (const ext of extractions) {
    for (const dep of ext.dependencies) {
      if (!dep.isForbidden) continue;
      const key = `${dep.source}->${dep.target}`;
      const existing = forbiddenMap.get(key);
      if (existing) {
        existing.count++;
        existing.details.push(dep);
      } else {
        forbiddenMap.set(key, { count: 1, details: [dep] });
      }
    }
  }

  for (const [key, info] of forbiddenMap) {
    const [source, target] = key.split("->");
    const srcAnchor = findLayerAnchor(extractions, source);
    const tgtAnchor = findLayerAnchor(extractions, target);
    if (!srcAnchor || !tgtAnchor) continue;
    addEdge(srcAnchor, tgtAnchor, "forbidden", true, {
      count: info.count,
      sourceFile: info.details[0]?.sourceFile,
      importPath: info.details[0]?.importPath,
    });
  }

  return { nodes, edges };
}

// --- Internal helpers ---

function firstLine(text: string): string {
  if (!text) return "";
  return text.split("\n")[0].trim();
}

function findLayerAnchor(extractions: LayerExtraction[], layerName: string): string | undefined {
  const ext = extractions.find((e) => e.layerName === layerName);
  if (!ext) return undefined;
  const first = ext.classes[0] ?? ext.interfaces[0] ?? ext.functions[0];
  return first?.name;
}

/**
 * Check if a type string references a given name (word-boundary match).
 */
function typeReferences(typeStr: string, name: string): boolean {
  if (!typeStr) return false;
  const regex = new RegExp(`\\b${escapeRegex(name)}\\b`);
  return regex.test(typeStr);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
