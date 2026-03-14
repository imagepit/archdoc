import { MarkdownBuilder } from "./markdown-builder.js";
import type { ProjectConfig, LayerConfig } from "../types/config.js";
import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";
import type { DiagramRenderer } from "../diagram/diagram-renderer.js";
import { formatName, kindLabel, kindLegendRows, categoryLegendRows, type ObjectKind } from "./emoji.js";
import { basename } from "node:path";

export interface IndexGenerateOptions {
  renderer?: DiagramRenderer;
}

export async function generateIndexMd(
  config: ProjectConfig,
  extractions: LayerExtraction[],
  options?: IndexGenerateOptions,
): Promise<string> {
  const md = new MarkdownBuilder();

  md.frontmatter({
    title: "System Architecture Overview",
    description: `${config.project.name} DDD layered architecture overview`,
  });

  md.heading(1, "System Architecture Overview");

  md.heading(2, "Project");

  md.table(
    ["Item", "Detail"],
    [
      ["**Name**", config.project.name],
      ["**Description**", config.project.description],
      ["**Source Root**", `\`${config.project.sourceRoot}/\``],
    ],
  );

  md.heading(2, "Layer Overview");

  md.table(
    ["Layer", "Path", "Responsibility", "Forbidden Imports", "Details"],
    config.layers.map((layer) => [
      `**${layer.name}** (${layer.nameJa})`,
      `\`${layer.path}/\``,
      layer.responsibility,
      layer.forbiddenImports.length > 0
        ? layer.forbiddenImports.map((f) => `\`${f}\``).join(", ")
        : "—",
      `[${layer.name.toLowerCase()}.md](./${layer.name.toLowerCase()}.md)`,
    ]),
  );

  // Legend
  md.heading(2, "Legend");

  md.paragraph("**Kind** — Object type indicators");
  md.table(["Icon", "Description"], kindLegendRows());

  md.paragraph("**Category** — Domain category indicators (applied to Component name)");
  md.table(["Icon", "Category"], categoryLegendRows());

  // Cross-layer object relationship diagram
  if (options?.renderer) {
    const diagram = await options.renderer.renderProjectOverview(extractions, config.layers);
    if (diagram) {
      md.heading(2, "Cross-Layer Dependency Violations");
      md.rawBlock(diagram);
    }
  }

  // Import Violations table
  const forbiddenDeps = collectForbiddenDeps(extractions);
  if (forbiddenDeps.length > 0) {
    md.heading(2, "Import Violations");
    md.paragraph(`**${forbiddenDeps.length} forbidden import(s) detected.**`);
    md.table(
      ["Source Layer", "File", "Forbidden Import", "Target Layer"],
      forbiddenDeps.map((dep) => [
        dep.source,
        `\`${dep.sourceFile ? basename(dep.sourceFile) : "—"}\``,
        `\`${dep.importPath ?? "—"}\``,
        dep.target,
      ]),
    );
  }

  // Non-Standard Layer Warnings
  const customLayers = config.layers.filter((l) => l.type === "custom");
  if (customLayers.length > 0) {
    md.heading(2, "Non-Standard Layer Warnings");
    md.paragraph(
      "以下のレイヤーはDDD標準4層（Domain / Application / Infrastructure / Presentation）に属しません。責務の重複・散在に注意してください。",
    );
    md.table(
      ["Layer", "Path", "Responsibility"],
      customLayers.map((l) => [
        `**${l.name}** (${l.nameJa})`,
        `\`${l.path}/\``,
        l.responsibility,
      ]),
    );
  }

  for (const layer of config.layers) {
    const extraction = extractions.find((e) => e.layerName === layer.name);
    if (!extraction) continue;

    md.heading(3, `${layer.name} (${layer.nameJa})`);

    const seen = new Set<string>();
    const components: string[][] = [];

    const addComponent = (name: string, kind: ObjectKind, category: string, description: string) => {
      const key = `${kind}:${name}:${category}`;
      if (seen.has(key)) return;
      seen.add(key);
      components.push([
        formatName(name, kind, category),
        kindLabel(kind),
        category,
        truncate(firstLine(description), 60),
      ]);
    };

    for (const c of extraction.classes) addComponent(c.name, "class", c.category, c.description);
    for (const i of extraction.interfaces) addComponent(i.name, "interface", i.category, i.description);
    for (const f of extraction.functions) addComponent(f.name, "function", f.category, f.description);
    for (const t of extraction.typeAliases) addComponent(t.name, "type", t.category, t.description);
    for (const e of extraction.enums) addComponent(e.name, "enum", e.category, e.description);
    for (const c of extraction.constants) addComponent(c.name, "const", c.category, c.description);

    if (components.length > 0) {
      md.table(["Component", "Kind", "Category", "Description"], components);
    } else {
      md.paragraph("*No exported components found.*");
    }
  }

  return md.build();
}

function collectForbiddenDeps(
  extractions: LayerExtraction[],
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  for (const ext of extractions) {
    for (const dep of ext.dependencies) {
      if (dep.isForbidden) deps.push(dep);
    }
  }
  return deps;
}

function firstLine(text: string): string {
  if (!text) return "—";
  const line = text.split("\n")[0].trim();
  return line || "—";
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}
