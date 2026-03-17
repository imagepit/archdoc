import { MarkdownBuilder } from "./markdown-builder.js";
import type { ProjectConfig, LayerConfig } from "../types/config.js";
import type { LayerExtraction, DependencyInfo, DddWarning, DddRole } from "../types/extracted.js";
import type { DiagramRenderer } from "../diagram/diagram-renderer.js";
import type { LocaleMessages } from "../i18n/types.js";
import { getMessages } from "../i18n/index.js";
import { formatName, kindLabel, kindLegendRows, categoryLegendRows, type ObjectKind } from "./emoji.js";
import { basename, relative, dirname } from "node:path";
import type { ResponsibilityViolation } from "../analyzer/nextjs-responsibility-checker.js";
import { generateResponsibilitySection } from "./responsibility-section.js";
import type { LayerCycle } from "../analyzer/cycle-detector.js";
import { generateCycleSection } from "./cycle-section.js";

/** ダイアグラムレンダラーを含むindex.md生成オプション。 */
export interface IndexGenerateOptions {
  renderer?: DiagramRenderer;
  messages?: LocaleMessages;
  /** Next.js responsibility separation violations to include in output. */
  responsibilityViolations?: ResponsibilityViolation[];
  /** Detected circular layer dependencies to include in output. */
  layerCycles?: LayerCycle[];
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

  // === H2: Project ===
  md.heading(2, t.index.project);

  md.table(
    [t.index.headerItem, t.index.headerDetail],
    [
      [t.index.labelName, config.project.name],
      [t.index.labelDescription, config.project.description],
      [t.index.labelSourceRoot, `\`${config.project.sourceRoot}/\``],
    ],
  );

  // === H2: Layers ===
  md.heading(2, t.index.layers);

  // H3: Layer List
  md.heading(3, t.index.layerList);

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

  // H3: Layer Dependency
  if (options?.renderer) {
    const layerDep = await options.renderer.renderLayerDependency(extractions, config.layers);
    if (layerDep) {
      md.heading(3, t.index.layerDependency);
      md.rawBlock(layerDep);
    }

    // Cross-layer object relationship diagram
    const crossLayerDiagram = await options.renderer.renderProjectOverview(extractions, config.layers);
    if (crossLayerDiagram) {
      md.rawBlock(crossLayerDiagram);
    }
  }

  // H3: Import Violations
  const forbiddenDeps = collectForbiddenDeps(extractions);
  if (forbiddenDeps.length > 0) {
    md.heading(3, t.index.importViolations);
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

  // H3: Non-Standard Layer Warnings
  const customLayers = config.layers.filter((l) => l.type === "custom");
  if (customLayers.length > 0) {
    md.heading(3, t.index.nonStandardWarnings);
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

  // H3: DDD Structural Warnings
  const allDddWarnings = extractions.flatMap((e) => e.dddWarnings ?? []);
  if (allDddWarnings.length > 0) {
    md.heading(3, t.ddd.warnings.sectionTitle);
    md.paragraph(t.ddd.warnings.warningsDetected(allDddWarnings.length));
    md.table(
      [t.ddd.warnings.headerComponent, t.ddd.warnings.headerRole, t.ddd.warnings.headerDetail],
      allDddWarnings.map((w) => [
        `\`${w.componentName}\``,
        t.ddd.roles[w.role],
        t.ddd.warnings.messages[w.warningType](w.propertyName),
      ]),
    );
  }

  // H3: Next.js Responsibility Separation Check
  if (options?.responsibilityViolations && options.responsibilityViolations.length > 0) {
    const locale = config.project.locale ?? "en";
    const section = generateResponsibilitySection(options.responsibilityViolations, locale);
    if (section) {
      md.rawBlock(section);
    }
  }

  // H3: Circular Layer Dependencies
  if (options?.layerCycles && options.layerCycles.length > 0) {
    const locale = config.project.locale ?? "en";
    const section = generateCycleSection(options.layerCycles, locale);
    if (section) {
      md.rawBlock(section);
    }
  }

  // === H2: Components ===
  md.heading(2, t.index.components);

  // H3: Legend
  md.heading(3, t.index.legend);

  md.paragraph(t.index.kindLegendLabel);
  md.table([t.index.headerIcon, t.index.headerDescription], kindLegendRows(t));

  md.paragraph(t.index.categoryLegendLabel);
  md.table([t.index.headerIcon, t.index.headerCategory], categoryLegendRows(t));

  // H3: Per-layer component tables (grouped by directory)
  for (const layer of config.layers) {
    const extraction = extractions.find((e) => e.layerName === layer.name);
    if (!extraction) continue;

    md.heading(3, `${layer.name} (${layer.nameJa})`);

    const dirGroups = groupComponentsByDir(extraction, layer.path);

    if (dirGroups.size === 0) {
      md.paragraph(t.index.noExportedComponents);
      continue;
    }

    for (const [relDir, items] of dirGroups) {
      if (relDir) {
        const formattedDir = relDir
          .split("/")
          .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
          .join("/");
        md.heading(4, formattedDir);
      }

      md.table(
        [t.index.headerComponent, t.index.headerKind, t.index.headerCategory, t.index.headerDescription],
        items.map((item) => [
          formatComponentWithRole(item, t),
          kindLabel(item.kind),
          item.category,
          truncate(firstLine(item.description), 60),
        ]),
      );
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

interface IndexComponentItem {
  name: string;
  kind: ObjectKind;
  category: string;
  description: string;
  dddRole?: DddRole;
}

function groupComponentsByDir(
  extraction: LayerExtraction,
  layerPath: string,
): Map<string, IndexComponentItem[]> {
  const map = new Map<string, IndexComponentItem[]>();
  const seen = new Set<string>();

  const addItem = (
    name: string,
    kind: ObjectKind,
    filePath: string,
    category: string,
    description: string,
    dddRole?: DddRole,
  ) => {
    const key = `${kind}:${name}:${category}`;
    if (seen.has(key)) return;
    seen.add(key);
    const dir = getRelativeDir(filePath, layerPath);
    const items = map.get(dir) ?? [];
    items.push({ name, kind, category, description, dddRole });
    map.set(dir, items);
  };

  for (const c of extraction.classes) addItem(c.name, "class", c.filePath, c.category, c.description, c.dddRole);
  for (const i of extraction.interfaces) addItem(i.name, "interface", i.filePath, i.category, i.description, i.dddRole);
  for (const f of extraction.functions) addItem(f.name, "function", f.filePath, f.category, f.description);
  for (const ta of extraction.typeAliases) addItem(ta.name, "type", ta.filePath, ta.category, ta.description);
  for (const e of extraction.enums) addItem(e.name, "enum", e.filePath, e.category, e.description);
  for (const c of extraction.constants) addItem(c.name, "const", c.filePath, c.category, c.description);

  return map;
}

function getRelativeDir(filePath: string, layerPath: string): string {
  const relPath = relative(layerPath, filePath);
  const dir = dirname(relPath);
  return dir === "." ? "" : dir;
}

function formatComponentWithRole(item: IndexComponentItem, t: LocaleMessages): string {
  const name = formatName(item.name, item.kind, item.category);
  if (!item.dddRole) return name;
  return `${name} (${t.ddd.roles[item.dddRole]})`;
}
