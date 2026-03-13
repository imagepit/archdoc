import { MarkdownBuilder } from "./markdown-builder.js";
import type { ProjectConfig, LayerConfig } from "../types/config.js";
import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";
import type { DiagramRenderer } from "../diagram/diagram-renderer.js";
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

    for (const c of extraction.classes) {
      const key = `${c.name}:${c.category}`;
      if (seen.has(key)) continue;
      seen.add(key);
      components.push([
        `\`${c.name}\``,
        "class",
        c.category,
        truncate(firstLine(c.description), 60),
      ]);
    }

    for (const i of extraction.interfaces) {
      const key = `${i.name}:${i.category}`;
      if (seen.has(key)) continue;
      seen.add(key);
      components.push([
        `\`${i.name}\``,
        "interface",
        i.category,
        truncate(firstLine(i.description), 60),
      ]);
    }

    for (const f of extraction.functions) {
      const key = `${f.name}:${f.category}`;
      if (seen.has(key)) continue;
      seen.add(key);
      components.push([
        `\`${f.name}()\``,
        "function",
        f.category,
        truncate(firstLine(f.description), 60),
      ]);
    }

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
