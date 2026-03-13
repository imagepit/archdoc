import type { DiagramRenderer } from "./diagram-renderer.js";
import type { LayerExtraction, ClassInfo, InterfaceInfo, RouteInfo } from "../types/extracted.js";
import type { LayerConfig } from "../types/config.js";
import type { ClassCallChain } from "../extractor/call-chain-analyzer.js";
import { buildCompactClassDiagram, buildCategoryClassDiagrams } from "./class-diagram-builder.js";
import { buildSequenceDiagram } from "./sequence-diagram-builder.js";
import { buildRouteSequenceDiagram } from "./route-sequence-builder.js";
import { buildProjectOverviewMermaid } from "./project-overview-builder.js";

/**
 * Mermaid implementation of DiagramRenderer.
 * Returns Mermaid code blocks ready to embed in Markdown.
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
}

function wrapMermaid(code: string): string {
  return `\`\`\`mermaid\n${code}\n\`\`\``;
}
