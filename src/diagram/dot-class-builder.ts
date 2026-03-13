import type {
  LayerExtraction,
  ClassInfo,
  InterfaceInfo,
} from "../types/extracted.js";

const COLS_IN_SUBGRAPH = 2;
const COLS_OF_SUBGRAPHS = 3;

// Category colors for subgraph backgrounds
const CATEGORY_COLORS = [
  "#e8eaf6", // indigo lightest
  "#e8f5e9", // green lightest
  "#fff3e0", // orange lightest
  "#fce4ec", // pink lightest
  "#e0f7fa", // cyan lightest
  "#f3e5f5", // purple lightest
  "#ede7f6", // deep purple lightest
  "#e1f5fe", // light blue lightest
  "#f1f8e9", // light green lightest
  "#fff8e1", // amber lightest
  "#fbe9e7", // deep orange lightest
  "#eceff1", // blue grey lightest
];

const CATEGORY_BORDER_COLORS = [
  "#9fa8da", // indigo
  "#a5d6a7", // green
  "#ffcc80", // orange
  "#ef9a9a", // pink
  "#80deea", // cyan
  "#ce93d8", // purple
  "#b39ddb", // deep purple
  "#81d4fa", // light blue
  "#c5e1a5", // light green
  "#ffe082", // amber
  "#ffab91", // deep orange
  "#b0bec5", // blue grey
];

/**
 * Build a compact overview DOT diagram for the entire layer.
 * Nodes show only class/interface name (no members) for readability.
 * Detailed member info is in the Markdown text.
 *
 * Groups by category. If all items share a single category,
 * falls back to subDirectory-based grouping.
 */
export function buildLayerDotDiagram(extraction: LayerExtraction): string {
  const classes = extraction.classes.filter((c) => c.isExported);
  const interfaces = extraction.interfaces.filter((i) => i.isExported);

  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = [];
  lines.push("digraph {");
  lines.push("  rankdir=TB");
  lines.push("  newrank=true");
  lines.push("  compound=true");
  lines.push("  nodesep=0.3");
  lines.push("  ranksep=0.5");
  lines.push('  node [shape=box, style="rounded,filled", fillcolor=white, fontname="Helvetica", fontsize=11]');
  lines.push('  edge [fontname="Helvetica", fontsize=9]');
  lines.push("");

  // Smart grouping: category first, fall back to subDirectory
  const groups = smartGroup(classes, interfaces);
  let colorIdx = 0;

  // Track anchor nodes per subgraph for inter-subgraph grid
  const subgraphAnchors: string[] = [];

  for (const [groupLabel, items] of groups) {
    const clusterId = sanitizeId(groupLabel);
    const bgColor = CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length];
    const borderColor = CATEGORY_BORDER_COLORS[colorIdx % CATEGORY_BORDER_COLORS.length];
    colorIdx++;

    lines.push(`  subgraph cluster_${clusterId} {`);
    lines.push(`    label="${escapeLabel(groupLabel)}"`);
    lines.push(`    style="rounded,filled"`);
    lines.push(`    color="${borderColor}"`);
    lines.push(`    fillcolor="${bgColor}"`);
    lines.push(`    fontname="Helvetica Bold"`);
    lines.push(`    fontsize=13`);
    lines.push("");

    const nodeIds: string[] = [];
    for (const item of items) {
      if (item.kind === "class") {
        const cls = item.data as ClassInfo;
        lines.push(`    ${renderCompactClassNode(cls)}`);
        nodeIds.push(sanitizeId(cls.name));
      } else {
        const iface = item.data as InterfaceInfo;
        lines.push(`    ${renderCompactInterfaceNode(iface)}`);
        nodeIds.push(sanitizeId(iface.name));
      }
    }

    if (nodeIds.length > 0) {
      subgraphAnchors.push(nodeIds[0]);
    }

    // 2-column grid within subgraph
    if (nodeIds.length > COLS_IN_SUBGRAPH) {
      lines.push("");
      for (let r = 0; r < nodeIds.length; r += COLS_IN_SUBGRAPH) {
        const row = nodeIds.slice(r, r + COLS_IN_SUBGRAPH);
        lines.push(`    { rank=same; ${row.join("; ")} }`);
      }
      for (let r = 0; r + COLS_IN_SUBGRAPH < nodeIds.length; r += COLS_IN_SUBGRAPH) {
        lines.push(`    ${nodeIds[r]} -> ${nodeIds[r + COLS_IN_SUBGRAPH]} [style=invis]`);
      }
    }

    lines.push("  }");
    lines.push("");
  }

  // 3-column grid for subgraphs: invisible edges between anchor nodes
  if (subgraphAnchors.length > COLS_OF_SUBGRAPHS) {
    lines.push("  // Subgraph grid layout");
    for (let r = 0; r < subgraphAnchors.length; r += COLS_OF_SUBGRAPHS) {
      const row = subgraphAnchors.slice(r, r + COLS_OF_SUBGRAPHS);
      if (row.length > 1) {
        lines.push(`  { rank=same; ${row.join("; ")} }`);
      }
    }
    for (let r = 0; r + COLS_OF_SUBGRAPHS < subgraphAnchors.length; r += COLS_OF_SUBGRAPHS) {
      lines.push(`  ${subgraphAnchors[r]} -> ${subgraphAnchors[r + COLS_OF_SUBGRAPHS]} [style=invis]`);
    }
    lines.push("");
  }

  // Relationships
  const allNames = new Set([
    ...classes.map((c) => c.name),
    ...interfaces.map((i) => i.name),
  ]);

  for (const cls of classes) {
    if (cls.extendsClass && allNames.has(cls.extendsClass)) {
      lines.push(
        `  ${sanitizeId(cls.name)} -> ${sanitizeId(cls.extendsClass)} [arrowhead=empty]`,
      );
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(
          `  ${sanitizeId(cls.name)} -> ${sanitizeId(impl)} [style=dashed, arrowhead=empty]`,
        );
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(
          `  ${sanitizeId(iface.name)} -> ${sanitizeId(ext)} [arrowhead=empty]`,
        );
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Build a DOT diagram with full member details for a group of classes/interfaces.
 * Uses the same visual style as the overview (colored subgraph, 2-column grid, rounded nodes).
 */
export function buildDetailDotDiagram(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string {
  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = [];
  lines.push("digraph {");
  lines.push("  rankdir=TB");
  lines.push("  newrank=true");
  lines.push("  compound=true");
  lines.push("  nodesep=0.4");
  lines.push("  ranksep=0.6");
  lines.push('  node [shape=Mrecord, style="filled", fillcolor=white, fontname="Helvetica", fontsize=10]');
  lines.push('  edge [fontname="Helvetica", fontsize=9]');
  lines.push("");

  // Wrap in a colored subgraph
  const bgColor = CATEGORY_COLORS[0];
  const borderColor = CATEGORY_BORDER_COLORS[0];

  lines.push(`  subgraph cluster_detail {`);
  lines.push(`    label=""`);
  lines.push(`    style="rounded,filled"`);
  lines.push(`    color="${borderColor}"`);
  lines.push(`    fillcolor="${bgColor}"`);
  lines.push("");

  const nodeIds: string[] = [];

  for (const iface of interfaces) {
    const id = sanitizeId(iface.name);
    nodeIds.push(id);
    const props = iface.properties
      .map((p) => `+ ${escapeLabel(p.name)}: ${escapeLabel(p.type)}`)
      .join("\\l");
    const methods = iface.methods
      .map((m) => `+ ${escapeLabel(m.name)}()`)
      .join("\\l");
    const sections = [
      `{\\<\\<interface\\>\\>\\n${escapeLabel(iface.name)}}`,
      props ? `${props}\\l` : "",
      methods ? `${methods}\\l` : "",
    ]
      .filter(Boolean)
      .join("|");
    lines.push(`    ${id} [label="{${sections}}", style="filled,dashed"]`);
  }

  for (const cls of classes) {
    const id = sanitizeId(cls.name);
    nodeIds.push(id);
    const props = cls.properties
      .map((p) => {
        const vis = p.visibility === "public" ? "+" : p.visibility === "protected" ? "#" : "-";
        return `${vis} ${escapeLabel(p.name)}: ${escapeLabel(p.type)}`;
      })
      .join("\\l");
    const methods = cls.methods
      .map((m) => {
        const vis = m.visibility === "public" ? "+" : m.visibility === "protected" ? "#" : "-";
        return `${vis} ${escapeLabel(m.name)}()`;
      })
      .join("\\l");
    const sections = [
      escapeLabel(cls.name),
      props ? `${props}\\l` : "",
      methods ? `${methods}\\l` : "",
    ]
      .filter(Boolean)
      .join("|");
    lines.push(`    ${id} [label="{${sections}}"]`);
  }

  // 2-column grid within subgraph
  if (nodeIds.length > COLS_IN_SUBGRAPH) {
    lines.push("");
    for (let r = 0; r < nodeIds.length; r += COLS_IN_SUBGRAPH) {
      const row = nodeIds.slice(r, r + COLS_IN_SUBGRAPH);
      lines.push(`    { rank=same; ${row.join("; ")} }`);
    }
    for (let r = 0; r + COLS_IN_SUBGRAPH < nodeIds.length; r += COLS_IN_SUBGRAPH) {
      lines.push(`    ${nodeIds[r]} -> ${nodeIds[r + COLS_IN_SUBGRAPH]} [style=invis]`);
    }
  }

  lines.push("  }");
  lines.push("");

  // Relationships
  const allNames = new Set([
    ...classes.map((c) => c.name),
    ...interfaces.map((i) => i.name),
  ]);

  for (const cls of classes) {
    if (cls.extendsClass && allNames.has(cls.extendsClass)) {
      lines.push(`  ${sanitizeId(cls.name)} -> ${sanitizeId(cls.extendsClass)} [arrowhead=empty]`);
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(`  ${sanitizeId(cls.name)} -> ${sanitizeId(impl)} [style=dashed, arrowhead=empty]`);
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(`  ${sanitizeId(iface.name)} -> ${sanitizeId(ext)} [arrowhead=empty]`);
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

// --- Internal types and helpers ---

interface CategorizedItem {
  kind: "class" | "interface";
  data: ClassInfo | InterfaceInfo;
}

/**
 * Smart grouping: use category by default.
 * If all items share a single category, fall back to subDirectory grouping.
 */
function smartGroup(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): Map<string, CategorizedItem[]> {
  const categoryGroups = groupByCategory(classes, interfaces);

  // If only one category, try subDirectory-based grouping
  if (categoryGroups.size <= 1) {
    const subDirGroups = groupBySubDirectory(classes, interfaces);
    if (subDirGroups.size > 1) {
      return subDirGroups;
    }
  }

  return categoryGroups;
}

function groupByCategory(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): Map<string, CategorizedItem[]> {
  const map = new Map<string, CategorizedItem[]>();

  for (const cls of classes) {
    const items = map.get(cls.category) ?? [];
    items.push({ kind: "class", data: cls });
    map.set(cls.category, items);
  }

  for (const iface of interfaces) {
    const items = map.get(iface.category) ?? [];
    items.push({ kind: "interface", data: iface });
    map.set(iface.category, items);
  }

  return map;
}

function groupBySubDirectory(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): Map<string, CategorizedItem[]> {
  const map = new Map<string, CategorizedItem[]>();

  for (const cls of classes) {
    const label = formatSubDirLabel(cls.subDirectory);
    const items = map.get(label) ?? [];
    items.push({ kind: "class", data: cls });
    map.set(label, items);
  }

  for (const iface of interfaces) {
    const label = formatSubDirLabel(iface.subDirectory);
    const items = map.get(label) ?? [];
    items.push({ kind: "interface", data: iface });
    map.set(label, items);
  }

  return map;
}

function formatSubDirLabel(subDir: string): string {
  if (!subDir) return "General";
  return subDir
    .split("/")
    .map((segment) =>
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
    .join(" / ");
}

function renderCompactClassNode(cls: ClassInfo): string {
  const id = sanitizeId(cls.name);
  const memberCount = cls.properties.length + cls.methods.length;
  const label = `${escapeLabel(cls.name)}\\n(${memberCount} members)`;
  return `${id} [label="${label}"]`;
}

function renderCompactInterfaceNode(iface: InterfaceInfo): string {
  const id = sanitizeId(iface.name);
  const memberCount = iface.properties.length + iface.methods.length;
  const label = `≪interface≫\\n${escapeLabel(iface.name)}\\n(${memberCount} members)`;
  return `${id} [label="${label}", style="rounded,filled,dashed"]`;
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
