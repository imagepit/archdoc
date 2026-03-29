import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";
import type { ProjectConfig, LayerConfig } from "../types/config.js";
import type { ResponsibilityViolation } from "../analyzer/nextjs-responsibility-checker.js";
import { relative, dirname } from "node:path";

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
 * Uses file-path-based unique IDs to handle duplicate names (e.g. GET, POST in multiple route.ts).
 * Creates nested sub-directory compound nodes for multi-level folder visualization.
 */
export function buildCytoscapeElements(
  config: ProjectConfig,
  extractions: LayerExtraction[],
  options?: CytoscapeOptions,
): CytoscapeElements {
  const nodes: CytoscapeNode[] = [];
  const edges: CytoscapeEdge[] = [];

  // --- Layer compound nodes ---
  for (const layer of config.layers) {
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

  // --- Build layer path lookup ---
  const layerPathMap = new Map<string, string>();
  for (const layer of config.layers) {
    layerPathMap.set(layer.name, layer.path);
  }

  // --- Track all node IDs for edge resolution ---
  const allNodeIds = new Set<string>();
  // Map: component name → list of node IDs (for resolving edges to name-based references)
  const nameToIds = new Map<string, string[]>();
  // Map: filePath (normalized) → node ID
  const fileToNodeId = new Map<string, string>();

  // --- Sub-directory compound nodes (created on demand, nested) ---
  const subDirNodes = new Set<string>();

  const MAX_SUBDIR_DEPTH = 2;

  function ensureSubDirChain(layerName: string, filePath: string): string {
    const layerPath = layerPathMap.get(layerName) ?? "";
    const relDir = extractRelativeDir(filePath, layerPath);
    if (!relDir) return `layer:${layerName}`;

    const parts = relDir.split("/");
    // Limit depth: truncate to MAX_SUBDIR_DEPTH levels
    const limitedParts = parts.slice(0, MAX_SUBDIR_DEPTH);
    let parentId = `layer:${layerName}`;

    for (let depth = 0; depth < limitedParts.length; depth++) {
      const dirPath = limitedParts.slice(0, depth + 1).join("/");
      const subDirId = `subdir:${layerName}:${dirPath}`;

      if (!subDirNodes.has(subDirId)) {
        subDirNodes.add(subDirId);
        nodes.push({
          data: {
            id: subDirId,
            label: limitedParts[depth],
            parent: parentId,
            kind: "subdir",
            category: "",
            layer: layerName,
            filePath: "",
            description: "",
          },
        });
      }
      parentId = subDirId;
    }

    return parentId;
  }

  /**
   * Generate a unique node ID from component name + file path.
   * For unique names across the project, just use the name.
   * For duplicated names (GET, POST etc), append a path suffix.
   */
  function makeNodeId(name: string, filePath: string, layerName: string): string {
    const layerPath = layerPathMap.get(layerName) ?? "";
    const relDir = extractRelativeDir(filePath, layerPath);
    // Use full path for unique ID (not limited by MAX_SUBDIR_DEPTH)
    const pathSuffix = relDir ? relDir.replace(/\//g, "_") : "";
    return pathSuffix ? `${name}__${pathSuffix}` : name;
  }

  function addNode(
    name: string,
    kind: string,
    filePath: string,
    layerName: string,
    category: string,
    description: string,
    extra?: { dddRole?: string },
  ): string {
    const nodeId = makeNodeId(name, filePath, layerName);
    if (allNodeIds.has(nodeId)) return nodeId;
    allNodeIds.add(nodeId);

    const ids = nameToIds.get(name) ?? [];
    ids.push(nodeId);
    nameToIds.set(name, ids);

    const normalized = normalizePath(filePath);
    if (!fileToNodeId.has(normalized)) {
      fileToNodeId.set(normalized, nodeId);
    }

    const parentId = ensureSubDirChain(layerName, filePath);

    nodes.push({
      data: {
        id: nodeId,
        label: name,
        parent: parentId,
        kind,
        category,
        layer: layerName,
        filePath,
        description: firstLine(description),
        dddRole: extra?.dddRole,
      },
    });

    return nodeId;
  }

  // --- Collect all component nodes ---
  for (const ext of extractions) {
    for (const cls of ext.classes) {
      if (!cls.isExported) continue;
      addNode(cls.name, "class", cls.filePath, ext.layerName, cls.category, cls.description, { dddRole: cls.dddRole });
    }
    for (const iface of ext.interfaces) {
      if (!iface.isExported) continue;
      addNode(iface.name, "interface", iface.filePath, ext.layerName, iface.category, iface.description, { dddRole: iface.dddRole });
    }
    for (const func of ext.functions) {
      if (!func.isExported) continue;
      addNode(func.name, "function", func.filePath, ext.layerName, func.category, func.description);
    }
    for (const ta of ext.typeAliases) {
      if (!ta.isExported) continue;
      addNode(ta.name, "type", ta.filePath, ext.layerName, ta.category, ta.description);
    }
    for (const en of ext.enums) {
      if (!en.isExported) continue;
      addNode(en.name, "enum", en.filePath, ext.layerName, en.category, en.description);
    }
    for (const c of ext.constants) {
      if (!c.isExported) continue;
      addNode(c.name, "const", c.filePath, ext.layerName, c.category, c.description);
    }
  }

  // --- Edge helpers ---
  const edgeSeen = new Set<string>();
  let edgeCounter = 0;

  function addEdge(
    source: string,
    target: string,
    type: string,
    isForbidden: boolean,
    extra?: { count?: number; sourceFile?: string; importPath?: string },
  ) {
    if (source === target) return;
    const key = `${source}->${target}:${type}`;
    if (edgeSeen.has(key)) return;
    if (!allNodeIds.has(source) || !allNodeIds.has(target)) return;
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
  }

  /** Resolve a component name to its node ID(s). Returns first match. */
  function resolveNodeId(name: string): string | null {
    const ids = nameToIds.get(name);
    return ids?.[0] ?? null;
  }

  /** Resolve a component name from the same file context. */
  function resolveNodeIdFromFile(name: string, contextFilePath: string, layerName: string): string {
    // First try: exact path-qualified ID
    const layerPath = layerPathMap.get(layerName) ?? "";
    const relDir = extractRelativeDir(contextFilePath, layerPath);
    const pathSuffix = relDir ? relDir.replace(/\//g, "_") : "";
    const qualifiedId = pathSuffix ? `${name}__${pathSuffix}` : name;
    if (allNodeIds.has(qualifiedId)) return qualifiedId;
    // Fallback: first by name
    return resolveNodeId(name) ?? name;
  }

  // --- Collect relationship edges ---
  for (const ext of extractions) {
    for (const cls of ext.classes) {
      if (!cls.isExported) continue;
      const srcId = resolveNodeIdFromFile(cls.name, cls.filePath, ext.layerName);

      if (cls.extendsClass) {
        const tgt = resolveNodeId(cls.extendsClass);
        if (tgt) addEdge(srcId, tgt, "extends", false);
      }
      for (const impl of cls.implementsInterfaces) {
        const tgt = resolveNodeId(impl);
        if (tgt) addEdge(srcId, tgt, "implements", false);
      }

      for (const prop of cls.properties) {
        for (const [name, ids] of nameToIds) {
          if (name === cls.name) continue;
          if (typeReferences(prop.type, name)) {
            addEdge(srcId, ids[0], "association", false);
          }
        }
      }

      for (const method of cls.methods) {
        for (const [name, ids] of nameToIds) {
          if (name === cls.name) continue;
          if (typeReferences(method.returnType, name)) {
            addEdge(srcId, ids[0], "dependency", false);
          }
          for (const param of method.parameters) {
            if (typeReferences(param.type, name)) {
              addEdge(srcId, ids[0], "dependency", false);
            }
          }
        }
      }
    }

    for (const iface of ext.interfaces) {
      if (!iface.isExported) continue;
      const srcId = resolveNodeIdFromFile(iface.name, iface.filePath, ext.layerName);

      for (const ext2 of iface.extendsInterfaces) {
        const tgt = resolveNodeId(ext2);
        if (tgt) addEdge(srcId, tgt, "extends", false);
      }

      for (const prop of iface.properties) {
        for (const [name, ids] of nameToIds) {
          if (name === iface.name) continue;
          if (typeReferences(prop.type, name)) {
            addEdge(srcId, ids[0], "association", false);
          }
        }
      }

      for (const method of iface.methods) {
        for (const [name, ids] of nameToIds) {
          if (name === iface.name) continue;
          if (typeReferences(method.returnType, name)) {
            addEdge(srcId, ids[0], "dependency", false);
          }
          for (const param of method.parameters) {
            if (typeReferences(param.type, name)) {
              addEdge(srcId, ids[0], "dependency", false);
            }
          }
        }
      }
    }

    for (const func of ext.functions) {
      if (!func.isExported) continue;
      const srcId = resolveNodeIdFromFile(func.name, func.filePath, ext.layerName);
      for (const [name, ids] of nameToIds) {
        if (name === func.name) continue;
        if (typeReferences(func.returnType, name)) {
          addEdge(srcId, ids[0], "dependency", false);
        }
        for (const param of func.parameters) {
          if (typeReferences(param.type, name)) {
            addEdge(srcId, ids[0], "dependency", false);
          }
        }
      }
    }

    for (const chain of ext.callChains) {
      const srcId = resolveNodeId(chain.className);
      if (!srcId) continue;
      for (const dep of chain.constructorDeps) {
        const tgt = resolveNodeId(dep.typeName);
        if (tgt) addEdge(srcId, tgt, "dependency", false);
      }
    }
  }

  // --- Import-level dependencies ---
  for (const ext of extractions) {
    for (const dep of ext.dependencies) {
      if (dep.type !== "import") continue;
      if (dep.source === dep.target) continue;

      const srcNodeId = dep.sourceFile ? findNodeByFile(fileToNodeId, dep.sourceFile) : null;
      const tgtNodeId = dep.importPath ? findNodeByImport(fileToNodeId, dep.importPath) : null;

      if (srcNodeId && tgtNodeId && srcNodeId !== tgtNodeId) {
        if (dep.isForbidden) {
          addEdge(srcNodeId, tgtNodeId, "forbidden", true, {
            sourceFile: dep.sourceFile,
            importPath: dep.importPath,
          });
        } else {
          addEdge(srcNodeId, tgtNodeId, "import", false);
        }
      } else if (dep.isForbidden) {
        const srcAnchor = findLayerAnchor(nameToIds, extractions, dep.source);
        const tgtAnchor = findLayerAnchor(nameToIds, extractions, dep.target);
        if (srcAnchor && tgtAnchor) {
          addEdge(srcAnchor, tgtAnchor, "forbidden", true, {
            sourceFile: dep.sourceFile,
            importPath: dep.importPath,
          });
        }
      }
    }
  }

  // --- Responsibility separation violations ---
  if (options?.responsibilityViolations) {
    for (const v of options.responsibilityViolations) {
      if (v.rule !== "app-to-infra" && v.rule !== "app-to-domain") continue;

      const srcNodeId = findNodeByFile(fileToNodeId, v.filePath);
      const importMatch = v.detail.match(/imports\s+`([^`]+)`/);
      const importPath = importMatch?.[1];
      const tgtNodeId = importPath ? findNodeByImport(fileToNodeId, importPath) : null;

      if (srcNodeId && tgtNodeId && srcNodeId !== tgtNodeId) {
        addEdge(srcNodeId, tgtNodeId, "forbidden", true, {
          sourceFile: v.filePath,
          importPath: importPath,
        });
      } else if (srcNodeId) {
        const targetLayerName = v.rule === "app-to-infra"
          ? extractions.find(e => config.layers.find(l => l.name === e.layerName && l.type === "infrastructure"))?.layerName
          : extractions.find(e => config.layers.find(l => l.name === e.layerName && l.type === "domain"))?.layerName;
        if (targetLayerName) {
          const anchor = findLayerAnchor(nameToIds, extractions, targetLayerName);
          if (anchor) {
            addEdge(srcNodeId, anchor, "forbidden", true, {
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

/**
 * Extract relative directory from filePath based on layerPath.
 * e.g., filePath="/proj/src/app/api/courses/route.ts", layerPath="src/app" → "api/courses"
 */
function extractRelativeDir(filePath: string, layerPath: string): string {
  const normalizedLayerPath = layerPath.replace(/^\/+|\/+$/g, "");
  const idx = filePath.indexOf(normalizedLayerPath);
  if (idx === -1) return "";

  const rest = filePath.substring(idx + normalizedLayerPath.length + 1);
  const parts = rest.split("/");
  if (parts.length <= 1) return "";
  // Return all directories except the filename
  return parts.slice(0, -1).join("/");
}

function normalizePath(filePath: string): string {
  return filePath
    .replace(/^\.\//, "")
    .replace(/\.(ts|tsx|js|jsx)$/, "");
}

function findNodeByFile(
  map: Map<string, string>,
  sourceFile: string,
): string | null {
  const normalized = normalizePath(sourceFile);
  const entry = map.get(normalized);
  if (entry) return entry;
  for (const [key, val] of map) {
    if (normalized.endsWith(key) || key.endsWith(normalized)) return val;
  }
  return null;
}

function findNodeByImport(
  map: Map<string, string>,
  importPath: string,
): string | null {
  let normalized = normalizePath(importPath);
  normalized = normalized.replace(/^@\//, "src/").replace(/^~\//, "src/");

  const entry = map.get(normalized);
  if (entry) return entry;
  for (const [key, val] of map) {
    if (normalized.endsWith(key) || key.endsWith(normalized)) return val;
    const importBase = normalized.split("/").pop() ?? "";
    const keyBase = key.split("/").pop() ?? "";
    if (importBase && importBase === keyBase) return val;
  }
  return null;
}

function findLayerAnchor(
  nameToIds: Map<string, string[]>,
  extractions: LayerExtraction[],
  layerName: string,
): string | null {
  const ext = extractions.find((e) => e.layerName === layerName);
  if (!ext) return null;
  const first = ext.classes[0] ?? ext.interfaces[0] ?? ext.functions[0];
  if (!first) return null;
  return nameToIds.get(first.name)?.[0] ?? null;
}

function typeReferences(typeStr: string, name: string): boolean {
  if (!typeStr) return false;
  const regex = new RegExp(`\\b${escapeRegex(name)}\\b`);
  return regex.test(typeStr);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
