import { MarkdownBuilder } from "./markdown-builder.js";
import type { LayerConfig } from "../types/config.js";
import type {
  LayerExtraction,
  ClassInfo,
  InterfaceInfo,
  FunctionInfo,
  MethodInfo,
  MethodSignatureInfo,
} from "../types/extracted.js";
import type { CallChainEntry } from "../types/extracted.js";
import type { DiagramRenderer } from "../diagram/diagram-renderer.js";

export interface GenerateOptions {
  renderer: DiagramRenderer;
}

export async function generateLayerMd(
  layer: LayerConfig,
  extraction: LayerExtraction,
  options: GenerateOptions,
): Promise<string> {
  const md = new MarkdownBuilder();
  const { renderer } = options;

  md.frontmatter({
    title: `${layer.name} — ${layer.nameJa} API Spec`,
    description: layer.responsibility,
  });

  md.heading(1, `${layer.name} — ${layer.nameJa} API Spec`);

  md.heading(2, "Responsibilities & Constraints");

  md.table(
    ["Item", "Detail"],
    [
      ["**Path**", `\`${layer.path}/\``],
      ["**Responsibility**", layer.responsibility],
      [
        "**Forbidden Imports**",
        layer.forbiddenImports.length > 0
          ? layer.forbiddenImports.map((f) => `\`${f}\``).join(", ")
          : "—",
      ],
    ],
  );

  if (layer.description) {
    md.paragraph(layer.description.trim());
  }

  // Layer-level overview diagram (compact)
  const overview = await renderer.renderLayerOverview(extraction);
  if (overview) {
    md.rawBlock(overview);
  }

  const categories = groupByCategory(extraction);

  for (const [category, items] of categories) {
    md.heading(2, category);

    // Check if items span multiple subdirectories
    const subDirGroups = groupBySubDirectory(items);

    if (subDirGroups.size > 1) {
      // Multiple subdirectories: create sub-sections per subdirectory
      for (const [subDir, subItems] of subDirGroups) {
        const subDirLabel = formatSubDirLabel(subDir);
        md.heading(3, subDirLabel);

        await renderGroupDiagramAndItems(
          md,
          subItems,
          extraction.callChains,
          renderer,
          4,
        );
      }
    } else {
      // Single group (or no subdirectory): render as before
      await renderGroupDiagramAndItems(
        md,
        items,
        extraction.callChains,
        renderer,
        3,
      );
    }
  }

  return md.build();
}

interface CategorizedItem {
  kind: "class" | "interface" | "function";
  data: ClassInfo | InterfaceInfo | FunctionInfo;
}

/**
 * Render the class diagram and individual items for a group.
 * headingLevel controls where individual class/interface headings start.
 */
async function renderGroupDiagramAndItems(
  md: MarkdownBuilder,
  items: CategorizedItem[],
  callChains: CallChainEntry[],
  renderer: DiagramRenderer,
  headingLevel: number,
): Promise<void> {
  const catClasses = items
    .filter((i) => i.kind === "class")
    .map((i) => i.data as ClassInfo);
  const catInterfaces = items
    .filter((i) => i.kind === "interface")
    .map((i) => i.data as InterfaceInfo);

  const detailDiagram = await renderer.renderDetailClassDiagram(catClasses, catInterfaces);
  if (detailDiagram) {
    md.rawBlock(detailDiagram);
  }

  for (const item of items) {
    if (item.kind === "class") {
      const cls = item.data as ClassInfo;
      renderClass(md, cls, headingLevel);
      await renderSequenceDiagram(md, cls.name, callChains, renderer);
    } else if (item.kind === "interface") {
      renderInterface(md, item.data as InterfaceInfo, headingLevel);
    } else {
      renderFunction(md, item.data as FunctionInfo, headingLevel);
    }
  }
}

function groupByCategory(
  extraction: LayerExtraction,
): Map<string, CategorizedItem[]> {
  const map = new Map<string, CategorizedItem[]>();
  const seen = new Set<string>();

  for (const cls of extraction.classes) {
    const key = `class:${cls.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(cls.category) ?? [];
    items.push({ kind: "class", data: cls });
    map.set(cls.category, items);
  }

  for (const iface of extraction.interfaces) {
    const key = `interface:${iface.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(iface.category) ?? [];
    items.push({ kind: "interface", data: iface });
    map.set(iface.category, items);
  }

  for (const func of extraction.functions) {
    const key = `function:${func.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(func.category) ?? [];
    items.push({ kind: "function", data: func });
    map.set(func.category, items);
  }

  return map;
}

/**
 * Group items by their subDirectory field.
 * Items with empty subDirectory are grouped under "".
 */
function groupBySubDirectory(
  items: CategorizedItem[],
): Map<string, CategorizedItem[]> {
  const map = new Map<string, CategorizedItem[]>();

  for (const item of items) {
    const subDir = getSubDirectory(item);
    const group = map.get(subDir) ?? [];
    group.push(item);
    map.set(subDir, group);
  }

  return map;
}

function getSubDirectory(item: CategorizedItem): string {
  return (item.data as ClassInfo | InterfaceInfo | FunctionInfo).subDirectory ?? "";
}

/**
 * Format a subdirectory path into a readable section label.
 * e.g. "order" → "Order", "create-order" → "Create Order"
 */
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

function renderClass(
  md: MarkdownBuilder,
  cls: ClassInfo,
  headingLevel: number = 3,
): void {
  md.heading(headingLevel, `\`${cls.name}\``);

  md.blockquote(
    [
      `**File**: \`${getFilename(cls.filePath)}\``,
      `**Type**: ${cls.category}`,
    ].join("\n"),
  );

  if (cls.description) {
    md.paragraph(cls.description);
  }

  if (cls.businessRules.length > 0) {
    md.paragraph("**Business Rules**");
    md.list(cls.businessRules);
  }

  if (cls.properties.length > 0) {
    md.paragraph("**Properties**");
    md.table(
      ["Property", "Type", "Required", "Description"],
      cls.properties.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (cls.methods.length > 0) {
    md.paragraph("**Methods**");
    for (const method of cls.methods) {
      renderMethod(md, method, headingLevel + 1);
    }
  }
}

function renderInterface(
  md: MarkdownBuilder,
  iface: InterfaceInfo,
  headingLevel: number = 3,
): void {
  md.heading(headingLevel, `\`${iface.name}\``);

  md.blockquote(
    [
      `**File**: \`${getFilename(iface.filePath)}\``,
      `**Type**: ${iface.category}`,
    ].join("\n"),
  );

  if (iface.description) {
    md.paragraph(iface.description);
  }

  if (iface.properties.length > 0) {
    md.paragraph("**Properties**");
    md.table(
      ["Property", "Type", "Required", "Description"],
      iface.properties.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (iface.methods.length > 0) {
    md.paragraph("**Methods**");
    for (const method of iface.methods) {
      renderMethodSignature(md, method, headingLevel + 1);
    }
  }
}

function renderFunction(
  md: MarkdownBuilder,
  func: FunctionInfo,
  headingLevel: number = 3,
): void {
  md.heading(headingLevel, `\`${func.name}()\``);

  md.blockquote(`**File**: \`${getFilename(func.filePath)}\``);

  if (func.description) {
    md.paragraph(func.description);
  }

  md.codeBlock(func.signature);

  if (func.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      func.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (func.returnType && func.returnType !== "void") {
    md.paragraph(`**Returns**: \`${func.returnType}\` ${func.returnDescription || ""}`);
  }

  if (func.throws.length > 0) {
    md.paragraph("**Throws**");
    md.table(
      ["Error", "Description"],
      func.throws.map((t) => [t.type ? `\`${t.type}\`` : "—", t.description]),
    );
  }

  if (func.businessRules.length > 0) {
    md.paragraph("**Business Rules**");
    md.list(func.businessRules);
  }
}

function renderMethod(
  md: MarkdownBuilder,
  method: MethodInfo,
  headingLevel: number = 4,
): void {
  md.heading(headingLevel, `\`${method.signature}\``);

  if (method.description) {
    md.paragraph(method.description);
  }

  if (method.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `**Returns**: \`${sanitizeTableType(method.returnType)}\` ${method.returnDescription || ""}`,
    );
  }

  if (method.throws.length > 0) {
    md.paragraph("**Throws**");
    md.table(
      ["Error", "Description"],
      method.throws.map((t) => [t.type ? `\`${t.type}\`` : "—", t.description]),
    );
  }

  if (method.businessRules.length > 0) {
    md.paragraph("**Business Rules**");
    md.list(method.businessRules);
  }
}

function renderMethodSignature(
  md: MarkdownBuilder,
  method: MethodSignatureInfo,
  headingLevel: number = 4,
): void {
  md.heading(headingLevel, `\`${method.signature}\``);

  if (method.description) {
    md.paragraph(method.description);
  }

  if (method.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `**Returns**: \`${sanitizeTableType(method.returnType)}\` ${method.returnDescription || ""}`,
    );
  }
}

async function renderSequenceDiagram(
  md: MarkdownBuilder,
  className: string,
  callChains: CallChainEntry[],
  renderer: DiagramRenderer,
): Promise<void> {
  const chain = callChains.find((c) => c.className === className);
  if (!chain || chain.methods.length === 0) return;

  md.paragraph("**Sequence Diagram**");
  const diagram = await renderer.renderSequenceDiagram(chain);
  if (diagram) {
    md.rawBlock(diagram);
  }
}

function getFilename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}

/** Replace `|` with `or` for safe Markdown table rendering */
function sanitizeTableType(type: string): string {
  return type.replace(/\s*\|\s*/g, " or ");
}
