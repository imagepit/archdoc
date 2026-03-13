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
import { buildCategoryClassDiagrams } from "../diagram/class-diagram-builder.js";
import { buildSequenceDiagram } from "../diagram/sequence-diagram-builder.js";
import type { CallChainEntry } from "../types/extracted.js";

export interface GenerateOptions {
  svg?: boolean;
}

export function generateLayerMd(
  layer: LayerConfig,
  extraction: LayerExtraction,
  options: GenerateOptions = {},
): string {
  const md = new MarkdownBuilder();

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

  const categories = groupByCategory(extraction);

  // SVG mode: embed a single SVG image link at the top
  if (options.svg) {
    const svgPath = `diagrams/${layer.name.toLowerCase()}-class.svg`;
    md.paragraph(`![${layer.name} Class Diagram](${svgPath})`);
  }

  for (const [category, items] of categories) {
    md.heading(2, category);

    // Mermaid diagrams only in non-SVG mode
    if (!options.svg) {
      const catClasses = items
        .filter((i) => i.kind === "class")
        .map((i) => i.data as ClassInfo);
      const catInterfaces = items
        .filter((i) => i.kind === "interface")
        .map((i) => i.data as InterfaceInfo);

      const diagrams = buildCategoryClassDiagrams(catClasses, catInterfaces);
      for (const diagram of diagrams) {
        md.codeBlock(diagram, "mermaid");
      }
    }

    for (const item of items) {
      if (item.kind === "class") {
        const cls = item.data as ClassInfo;
        renderClass(md, cls);
        renderSequenceDiagram(md, cls.name, extraction.callChains);
      } else if (item.kind === "interface") {
        renderInterface(md, item.data as InterfaceInfo);
      } else {
        renderFunction(md, item.data as FunctionInfo);
      }
    }
  }

  return md.build();
}

interface CategorizedItem {
  kind: "class" | "interface" | "function";
  data: ClassInfo | InterfaceInfo | FunctionInfo;
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

function renderClass(md: MarkdownBuilder, cls: ClassInfo): void {
  md.heading(3, `\`${cls.name}\``);

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
        `\`${p.type}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (cls.methods.length > 0) {
    md.paragraph("**Methods**");
    for (const method of cls.methods) {
      renderMethod(md, method);
    }
  }
}

function renderInterface(md: MarkdownBuilder, iface: InterfaceInfo): void {
  md.heading(3, `\`${iface.name}\``);

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
        `\`${p.type}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (iface.methods.length > 0) {
    md.paragraph("**Methods**");
    for (const method of iface.methods) {
      renderMethodSignature(md, method);
    }
  }
}

function renderFunction(md: MarkdownBuilder, func: FunctionInfo): void {
  md.heading(3, `\`${func.name}()\``);

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
        `\`${p.type}\``,
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

function renderMethod(md: MarkdownBuilder, method: MethodInfo): void {
  md.heading(4, `\`${method.signature}\``);

  if (method.description) {
    md.paragraph(method.description);
  }

  if (method.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${p.type}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `**Returns**: \`${method.returnType}\` ${method.returnDescription || ""}`,
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
): void {
  md.heading(4, `\`${method.signature}\``);

  if (method.description) {
    md.paragraph(method.description);
  }

  if (method.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${p.type}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `**Returns**: \`${method.returnType}\` ${method.returnDescription || ""}`,
    );
  }
}

function renderSequenceDiagram(
  md: MarkdownBuilder,
  className: string,
  callChains: CallChainEntry[],
): void {
  const chain = callChains.find((c) => c.className === className);
  if (!chain || chain.methods.length === 0) return;

  md.paragraph("**Sequence Diagram**");
  const diagram = buildSequenceDiagram(chain);
  if (diagram) {
    md.codeBlock(diagram, "mermaid");
  }
}

function getFilename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}
