import { MarkdownBuilder } from "./markdown-builder.js";
import type { ProjectConfig } from "../types/config.js";
import type { LayerExtraction } from "../types/extracted.js";

export function generateIndexMd(
  config: ProjectConfig,
  extractions: LayerExtraction[],
): string {
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

  for (const layer of config.layers) {
    const extraction = extractions.find((e) => e.layerName === layer.name);
    if (!extraction) continue;

    md.heading(3, `${layer.name} (${layer.nameJa})`);

    const components = [
      ...extraction.classes.map((c) => [
        `\`${getFilename(c.filePath)}\``,
        c.category,
        c.description || "—",
      ]),
      ...extraction.interfaces.map((i) => [
        `\`${getFilename(i.filePath)}\``,
        i.category,
        i.description || "—",
      ]),
      ...extraction.functions.map((f) => [
        `\`${getFilename(f.filePath)}\``,
        f.category,
        f.description || "—",
      ]),
    ];

    if (components.length > 0) {
      md.table(["File", "Type", "Description"], components);
    } else {
      md.paragraph("*No exported components found.*");
    }
  }

  return md.build();
}

function getFilename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}
