import { MarkdownBuilder } from "./markdown-builder.js";
import type { ProjectConfig, LayerConfig } from "../types/config.js";
import type { LayerExtraction, DependencyInfo } from "../types/extracted.js";
import type { DiagramRenderer } from "../diagram/diagram-renderer.js";
import type { LocaleMessages } from "../i18n/types.js";
import { getMessages } from "../i18n/index.js";
import { formatName, kindLabel, kindLegendRows, categoryLegendRows, type ObjectKind } from "./emoji.js";
import { basename } from "node:path";

/** ダイアグラムレンダラーを含むindex.md生成オプション。 */
export interface IndexGenerateOptions {
  renderer?: DiagramRenderer;
  messages?: LocaleMessages;
}

/**
 * プロジェクト全体の概要ドキュメントindex.mdを生成する。
 * @param config - プロジェクト設定
 * @param extractions - 全レイヤーの抽出結果
 * @param options - 生成オプション（省略可）
 * @returns 生成されたMarkdown文字列
 */
export async function generateIndexMd(
  config: ProjectConfig,
  extractions: LayerExtraction[],
  options?: IndexGenerateOptions,
): Promise<string> {
  const md = new MarkdownBuilder();
  const t = options?.messages ?? getMessages("en");

  md.frontmatter({
    title: t.index.systemArchitectureOverview,
    description: `${config.project.name} ${t.index.dddOverviewSuffix}`,
  });

  md.heading(1, t.index.systemArchitectureOverview);

  md.heading(2, t.index.project);

  md.table(
    [t.index.headerItem, t.index.headerDetail],
    [
      [t.index.labelName, config.project.name],
      [t.index.labelDescription, config.project.description],
      [t.index.labelSourceRoot, `\`${config.project.sourceRoot}/\``],
    ],
  );

  md.heading(2, t.index.layerOverview);

  md.table(
    [t.index.headerLayer, t.index.headerPath, t.index.headerResponsibility, t.index.headerForbiddenImports, t.index.headerDetails],
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

  // Layer Dependency diagram
  if (options?.renderer) {
    const layerDep = await options.renderer.renderLayerDependency(extractions, config.layers);
    if (layerDep) {
      md.heading(2, t.index.layerDependency);
      md.rawBlock(layerDep);
    }
  }

  // Legend
  md.heading(2, t.index.legend);

  md.paragraph(t.index.kindLegendLabel);
  md.table([t.index.headerIcon, t.index.headerDescription], kindLegendRows(t));

  md.paragraph(t.index.categoryLegendLabel);
  md.table([t.index.headerIcon, t.index.headerCategory], categoryLegendRows(t));

  // Cross-layer object relationship diagram
  if (options?.renderer) {
    const diagram = await options.renderer.renderProjectOverview(extractions, config.layers);
    if (diagram) {
      md.heading(2, t.index.crossLayerViolations);
      md.rawBlock(diagram);
    }
  }

  // Import Violations table
  const forbiddenDeps = collectForbiddenDeps(extractions);
  if (forbiddenDeps.length > 0) {
    md.heading(2, t.index.importViolations);
    md.paragraph(t.index.forbiddenImportsDetected(forbiddenDeps.length));
    md.table(
      [t.index.headerSourceLayer, t.index.headerFile, t.index.headerForbiddenImport, t.index.headerTargetLayer],
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
    md.heading(2, t.index.nonStandardWarnings);
    md.paragraph(t.index.nonStandardWarningText);
    md.table(
      [t.index.headerLayer, t.index.headerPath, t.index.headerResponsibility],
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
    for (const ta of extraction.typeAliases) addComponent(ta.name, "type", ta.category, ta.description);
    for (const e of extraction.enums) addComponent(e.name, "enum", e.category, e.description);
    for (const c of extraction.constants) addComponent(c.name, "const", c.category, c.description);

    if (components.length > 0) {
      md.table([t.index.headerComponent, t.index.headerKind, t.index.headerCategory, t.index.headerDescription], components);
    } else {
      md.paragraph(t.index.noExportedComponents);
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
