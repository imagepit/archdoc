import type {
  LayerExtraction,
  ClassInfo,
  InterfaceInfo,
} from "../types/extracted.js";

// Category colors for subgraph backgrounds
const CATEGORY_COLORS = [
  "#e8eaf6", // indigo lightest
  "#e8f5e9", // green lightest
  "#fff3e0", // orange lightest
  "#fce4ec", // pink lightest
  "#e0f7fa", // cyan lightest
  "#f3e5f5", // purple lightest
  "#e8eaf6", // repeat
];

export function buildLayerDotDiagram(extraction: LayerExtraction): string {
  const classes = extraction.classes.filter((c) => c.isExported);
  const interfaces = extraction.interfaces.filter((i) => i.isExported);

  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = [];
  lines.push("digraph {");
  lines.push("  rankdir=TB");
  lines.push('  node [shape=record, fontname="Helvetica", fontsize=10]');
  lines.push('  edge [fontname="Helvetica", fontsize=9]');
  lines.push("");

  // Group by category
  const categories = groupByCategory(classes, interfaces);
  let colorIdx = 0;

  for (const [category, items] of categories) {
    const clusterId = sanitizeId(category);
    const color = CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length];
    colorIdx++;

    lines.push(`  subgraph cluster_${clusterId} {`);
    lines.push(`    label="${escapeLabel(category)}"`);
    lines.push(`    style=filled; color="${color}"; fontname="Helvetica Bold"`);
    lines.push("");

    for (const item of items) {
      if (item.kind === "class") {
        lines.push(`    ${renderClassNode(item.data as ClassInfo)}`);
      } else {
        lines.push(`    ${renderInterfaceNode(item.data as InterfaceInfo)}`);
      }
    }

    lines.push("  }");
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
        `  ${sanitizeId(cls.name)} -> ${sanitizeId(cls.extendsClass)} [arrowhead=empty, label="extends"]`,
      );
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(
          `  ${sanitizeId(cls.name)} -> ${sanitizeId(impl)} [style=dashed, arrowhead=empty, label="implements"]`,
        );
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(
          `  ${sanitizeId(iface.name)} -> ${sanitizeId(ext)} [arrowhead=empty, label="extends"]`,
        );
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

interface CategorizedItem {
  kind: "class" | "interface";
  data: ClassInfo | InterfaceInfo;
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

function renderClassNode(cls: ClassInfo): string {
  const props = cls.properties
    .map((p) => `${visPrefix(p.visibility)}${p.name}: ${sanitizeType(p.type)}\\l`)
    .join("");

  const methods = cls.methods
    .map((m) => `${visPrefix(m.visibility)}${m.name}()\\l`)
    .join("");

  const label = `{${escapeLabel(cls.name)}|${props}|${methods}}`;
  return `${sanitizeId(cls.name)} [label="${label}"]`;
}

function renderInterfaceNode(iface: InterfaceInfo): string {
  const stereotype = "\\<\\<interface\\>\\>\\n";
  const props = iface.properties
    .map((p) => `+${p.name}: ${sanitizeType(p.type)}\\l`)
    .join("");

  const methods = iface.methods
    .map((m) => `+${m.name}()\\l`)
    .join("");

  const label = `{${stereotype}${escapeLabel(iface.name)}|${props}|${methods}}`;
  return `${sanitizeId(iface.name)} [label="${label}"]`;
}

function visPrefix(vis: "public" | "protected" | "private"): string {
  switch (vis) {
    case "public":
      return "+";
    case "protected":
      return "#";
    case "private":
      return "-";
  }
}

function sanitizeType(type: string): string {
  let result = type.replace(/\n/g, " ");
  // Collapse object literals
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/\{[^{}]*\}/g, "Object");
  }
  // Escape special DOT characters
  result = result.replace(/"/g, '\\"');
  result = result.replace(/</g, "\\<");
  result = result.replace(/>/g, "\\>");
  result = result.replace(/\|/g, "\\|");
  return result;
}

function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeLabel(text: string): string {
  return text
    .replace(/"/g, '\\"')
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>");
}
