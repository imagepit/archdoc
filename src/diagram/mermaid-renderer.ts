import { writeFileSync, mkdirSync } from "node:fs";
import type { DiagramRenderer } from "./diagram-renderer.js";
import type { LayerExtraction, ClassInfo, InterfaceInfo, RouteInfo, ClassCallChain } from "../types/extracted.js";
import type { LayerConfig, ProjectConfig } from "../types/config.js";
import { buildCompactClassDiagram, buildCategoryClassDiagrams } from "./class-diagram-builder.js";
import { buildSequenceDiagram } from "./sequence-diagram-builder.js";
import { buildRouteSequenceDiagram } from "./route-sequence-builder.js";
import { buildProjectOverviewMermaid, buildLayerDependencyMermaid } from "./project-overview-builder.js";
import { buildCytoscapeHtml } from "./cytoscape-html-builder.js";

/**
 * DiagramRendererのMermaid実装。
 * Markdownに埋め込み可能なMermaidコードブロックを返す。
 */
export class MermaidRenderer implements DiagramRenderer {
  async renderLayerOverview(extraction: LayerExtraction): Promise<string | null> {
    const diagram = buildCompactClassDiagram(extraction);
    if (!diagram) return null;
    return wrapMermaid(diagram);
  }

  async renderDetailClassDiagram(
    classes: ClassInfo[],
    interfaces: InterfaceInfo[],
  ): Promise<string | null> {
    const diagrams = buildCategoryClassDiagrams(classes, interfaces);
    if (diagrams.length === 0) return null;
    return diagrams.map(wrapMermaid).join("\n");
  }

  async renderSequenceDiagram(chain: ClassCallChain): Promise<string | null> {
    const diagram = buildSequenceDiagram(chain);
    if (!diagram) return null;
    return wrapMermaid(diagram);
  }

  async renderRouteSequenceDiagram(funcName: string, route: RouteInfo): Promise<string | null> {
    if (route.calls.length === 0) return null;
    const diagram = buildRouteSequenceDiagram(funcName, route);
    if (!diagram) return null;
    return wrapMermaid(diagram);
  }

  async renderProjectOverview(extractions: LayerExtraction[], layers?: LayerConfig[]): Promise<string | null> {
    const diagram = buildProjectOverviewMermaid(extractions, layers);
    if (!diagram) return null;
    return wrapMermaid(diagram);
  }

  async renderLayerDependency(extractions: LayerExtraction[], layers?: LayerConfig[]): Promise<string | null> {
    const diagram = buildLayerDependencyMermaid(extractions, layers);
    if (!diagram) return null;
    return wrapMermaid(diagram);
  }

  async renderInteractiveOverview(config: ProjectConfig, extractions: LayerExtraction[]): Promise<string | null> {
    const html = buildCytoscapeHtml(config, extractions);
    const filename = "component-graph.html";

    // MermaidRenderer has no diagramDir, so write alongside the output
    mkdirSync("diagrams", { recursive: true });
    writeFileSync(`diagrams/${filename}`, html);

    return [
      `<div style="position:relative;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin:16px 0;">`,
      `  <iframe src="diagrams/${filename}" width="100%" height="500" frameborder="0" style="border:none;"></iframe>`,
      `  <div style="position:absolute;top:8px;right:8px;display:flex;gap:6px;">`,
      `    <a href="diagrams/${filename}" target="_blank" style="padding:6px 12px;background:#1976d2;color:#fff;border-radius:4px;text-decoration:none;font-size:13px;">Open Full View</a>`,
      `  </div>`,
      `</div>`,
    ].join("\n");
  }
}

function wrapMermaid(code: string): string {
  return `\`\`\`mermaid\n${code}\n\`\`\``;
}
