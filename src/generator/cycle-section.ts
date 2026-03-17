import { MarkdownBuilder } from "./markdown-builder.js";
import { basename } from "node:path";
import type { LayerCycle } from "../analyzer/cycle-detector.js";

/**
 * Generate a Markdown section for layer circular dependency warnings.
 * Returns empty string if no cycles found.
 */
export function generateCycleSection(
  cycles: LayerCycle[],
  locale: "en" | "ja" = "en",
): string {
  if (cycles.length === 0) return "";

  const md = new MarkdownBuilder();

  const title = locale === "ja"
    ? "レイヤー間循環参照"
    : "Circular Layer Dependencies";

  md.heading(3, title);

  const summaryText = locale === "ja"
    ? `${cycles.length}件の循環参照が検出されました。`
    : `${cycles.length} circular dependency(ies) detected.`;
  md.paragraph(summaryText);

  const headerCycle = locale === "ja" ? "サイクル" : "Cycle";
  const headerFiles = locale === "ja" ? "関連ファイル" : "Related Files";
  const headerImport = locale === "ja" ? "インポート" : "Import";

  md.table(
    [headerCycle, headerFiles, headerImport],
    cycles.map((c) => {
      const cycleLabel = c.cycle.join(" → ");
      const files = [...new Set(c.edges
        .filter((e) => e.sourceFile)
        .map((e) => `\`${basename(e.sourceFile!)}\``))]
        .join(", ") || "—";
      const imports = [...new Set(c.edges
        .filter((e) => e.importPath)
        .map((e) => `\`${e.importPath}\``))]
        .slice(0, 3)
        .join(", ") || "—";
      return [cycleLabel, files, imports];
    }),
  );

  return md.build();
}
