import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";
import type { ProjectConfig, LayerConfig } from "../types/config.js";
import type { ResponsibilityViolation } from "../analyzer/nextjs-responsibility-checker.js";

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

/** Options for buildCytoscapeElements. */
export interface CytoscapeOptions {
  responsibilityViolations?: ResponsibilityViolation[];
}

/**
 * Build Cytoscape.js elements JSON from archdoc extraction data.
 * @param config - Project configuration
 * @param extractions - All layer extraction results
 * @param options - Optional violations data
 * @returns Cytoscape.js compatible elements
 */
export function buildCytoscapeElements(
  config: ProjectConfig,
  extractions: LayerExtraction[],
  options?: CytoscapeOptions,
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

  // --- Import-level dependencies (file → component mapping) ---
  // Build a filePath → component name lookup for resolving import targets
  const fileToComponent = new Map<string, { name: string; layer: string }>();
  for (const ext of extractions) {
    const allItems = [
      ...ext.classes, ...ext.interfaces, ...ext.functions,
      ...ext.typeAliases, ...ext.enums, ...ext.constants,
    ];
    for (const item of allItems) {
      if (!item.isExported) continue;
      // Normalize: strip leading "./" and extensions
      const normalized = normalizePath(item.filePath);
      if (!fileToComponent.has(normalized)) {
        fileToComponent.set(normalized, { name: item.name, layer: ext.layerName });
      }
    }
  }

  // Process all import dependencies
  for (const ext of extractions) {
    for (const dep of ext.dependencies) {
      if (dep.type !== "import") continue;
      if (dep.source === dep.target) continue; // skip same-layer

      // Find source component by sourceFile
      const srcComponent = dep.sourceFile ? findComponentByFile(fileToComponent, dep.sourceFile) : null;
      // Find target component by importPath
      const tgtComponent = dep.importPath ? findComponentByImport(fileToComponent, dep.importPath) : null;

      if (srcComponent && tgtComponent && srcComponent !== tgtComponent) {
        if (dep.isForbidden) {
          addEdge(srcComponent, tgtComponent, "forbidden", true, {
            sourceFile: dep.sourceFile,
            importPath: dep.importPath,
          });
        } else {
          addEdge(srcComponent, tgtComponent, "import", false);
        }
      } else if (dep.isForbidden) {
        // Fallback: anchor to first component in each layer
        const srcAnchor = findLayerAnchor(extractions, dep.source);
        const tgtAnchor = findLayerAnchor(extractions, dep.target);
        if (srcAnchor && tgtAnchor) {
          addEdge(srcAnchor, tgtAnchor, "forbidden", true, {
            count: 1,
            sourceFile: dep.sourceFile,
            importPath: dep.importPath,
          });
        }
      }
    }
  }

  // --- Responsibility separation violations → forbidden edges ---
  if (options?.responsibilityViolations) {
    for (const v of options.responsibilityViolations) {
      if (v.rule !== "app-to-infra" && v.rule !== "app-to-domain") continue;

      // Find source component from violation filePath
      const srcComponent = findComponentByFile(fileToComponent, v.filePath);

      // Extract import path from detail (format: "imports `@/path/to/module`" or "imports `../../path`")
      const importMatch = v.detail.match(/imports\s+`([^`]+)`/);
      const importPath = importMatch?.[1];
      const tgtComponent = importPath ? findComponentByImport(fileToComponent, importPath) : null;

      if (srcComponent && tgtComponent && srcComponent !== tgtComponent) {
        addEdge(srcComponent, tgtComponent, "forbidden", true, {
          sourceFile: v.filePath,
          importPath: importPath,
        });
      } else if (srcComponent) {
        // Fallback: connect to first component in the target layer
        const targetLayerName = v.rule === "app-to-infra"
          ? extractions.find(e => config.layers.find(l => l.name === e.layerName && l.type === "infrastructure"))?.layerName
          : extractions.find(e => config.layers.find(l => l.name === e.layerName && l.type === "domain"))?.layerName;
        if (targetLayerName) {
          const anchor = findLayerAnchor(extractions, targetLayerName);
          if (anchor) {
            addEdge(srcComponent, anchor, "forbidden", true, {
              sourceFile: v.filePath,
              importPath: importPath,
            });
          }
        }
      }
    }
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

function normalizePath(filePath: string): string {
  return filePath
    .replace(/^\.\//, "")
    .replace(/\.(ts|tsx|js|jsx)$/, "");
}

function findComponentByFile(
  map: Map<string, { name: string; layer: string }>,
  sourceFile: string,
): string | null {
  const normalized = normalizePath(sourceFile);
  const entry = map.get(normalized);
  if (entry) return entry.name;
  // Try partial match (sourceFile may be relative from different roots)
  for (const [key, val] of map) {
    if (normalized.endsWith(key) || key.endsWith(normalized)) return val.name;
  }
  return null;
}

function findComponentByImport(
  map: Map<string, { name: string; layer: string }>,
  importPath: string,
): string | null {
  // Strip path alias prefix (@/ or ~/)
  let normalized = normalizePath(importPath);
  normalized = normalized.replace(/^@\//, "src/").replace(/^~\//, "src/");

  // Direct match
  const entry = map.get(normalized);
  if (entry) return entry.name;
  // Partial match
  for (const [key, val] of map) {
    if (normalized.endsWith(key) || key.endsWith(normalized)) return val.name;
    // Also check if the import path's last segment matches a file
    const importBase = normalized.split("/").pop() ?? "";
    const keyBase = key.split("/").pop() ?? "";
    if (importBase && importBase === keyBase) return val.name;
  }
  return null;
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
