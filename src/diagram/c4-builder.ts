import type { ProjectConfig } from "../types/config.js";
import type { DependencyGraph } from "./dependency-graph.js";

/**
 * プロジェクト設定からMermaid構文のC4コンポーネント図を生成する。
 * @param config - プロジェクト設定
 * @param graph - 依存関係グラフ
 * @returns Mermaid形式のC4図文字列
 */
export function buildC4ComponentDiagram(
  config: ProjectConfig,
  graph: DependencyGraph,
): string {
  const lines: string[] = [];
  lines.push("C4Component");
  lines.push(`  title ${config.project.name} — Component Diagram`);
  lines.push("");

  for (const layer of config.layers) {
    lines.push(`  Container_Boundary(${layer.name}, "${layer.name} (${layer.nameJa})") {`);

    for (const [catKey, catLabel] of Object.entries(layer.categories)) {
      const id = `${layer.name}_${catKey}`;
      lines.push(`    Component(${id}, "${catLabel}", "")`);
    }

    lines.push("  }");
    lines.push("");
  }

  for (const edge of graph.edges) {
    const style = edge.isForbidden ? ", $tags='forbidden'" : "";
    lines.push(`  Rel(${edge.source}, ${edge.target}, "uses (${edge.count})"${style})`);
  }

  return lines.join("\n");
}
