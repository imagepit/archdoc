import { instance } from "@viz-js/viz";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { DiagramRenderer } from "./diagram-renderer.js";
import type { LayerExtraction, ClassInfo, InterfaceInfo, RouteInfo, ClassCallChain } from "../types/extracted.js";
import type { LayerConfig } from "../types/config.js";
import { buildLayerDotDiagram, buildDetailDotDiagram } from "./dot-class-builder.js";
import { buildSequenceDiagram } from "./sequence-diagram-builder.js";
import { buildRouteSequenceDiagram } from "./route-sequence-builder.js";
import { buildProjectOverviewDot, buildLayerDependencyDot } from "./project-overview-builder.js";

/**
 * DOTグラフ文字列をviz.jsでSVGにレンダリングする。
 * @param dotCode - DOT形式のグラフ文字列
 * @param engine - レンダリングエンジン（デフォルト: "dot"）
 * @returns SVG文字列
 */
export async function renderDotToSvg(dotCode: string, engine: "dot" | "fdp" | "neato" = "dot"): Promise<string> {
  const viz = await instance();
  return viz.renderString(dotCode, { format: "svg", engine });
}

/**
 * DiagramRendererのSVG実装。
 * DOT → SVGファイルを生成し、Markdown画像参照文字列を返す。
 */
export class SvgRenderer implements DiagramRenderer {
  private fileCounter = 0;

  constructor(
    private readonly diagramDir: string,
    private readonly relativeDir: string,
  ) {
    mkdirSync(diagramDir, { recursive: true });
  }

  async renderLayerOverview(extraction: LayerExtraction): Promise<string | null> {
    const dot = buildLayerDotDiagram(extraction);
    if (!dot) return null;

    const filename = `${extraction.layerName.toLowerCase()}-class.svg`;
    const svg = await renderDotToSvg(dot);
    writeFileSync(join(this.diagramDir, filename), svg);

    return `![${extraction.layerName} Class Diagram](${this.relativeDir}/${filename})`;
  }

  async renderDetailClassDiagram(
    classes: ClassInfo[],
    interfaces: InterfaceInfo[],
  ): Promise<string | null> {
    const exportedClasses = classes.filter((c) => c.isExported);
    const exportedInterfaces = interfaces.filter((i) => i.isExported);
    if (exportedClasses.length === 0 && exportedInterfaces.length === 0) return null;

    const dot = buildDetailDotDiagram(exportedClasses, exportedInterfaces);
    if (!dot) return null;

    this.fileCounter++;
    const filename = `detail-${this.fileCounter}.svg`;
    const svg = await renderDotToSvg(dot);
    writeFileSync(join(this.diagramDir, filename), svg);

    return `![Class Diagram](${this.relativeDir}/${filename})`;
  }

  async renderSequenceDiagram(chain: ClassCallChain): Promise<string | null> {
    // Fallback to Mermaid (DOT has no sequence diagram support)
    const diagram = buildSequenceDiagram(chain);
    if (!diagram) return null;
    return `\`\`\`mermaid\n${diagram}\n\`\`\``;
  }

  async renderRouteSequenceDiagram(funcName: string, route: RouteInfo): Promise<string | null> {
    // Fallback to Mermaid (DOT has no sequence diagram support)
    const diagram = buildRouteSequenceDiagram(funcName, route);
    if (!diagram) return null;
    return `\`\`\`mermaid\n${diagram}\n\`\`\``;
  }

  async renderProjectOverview(extractions: LayerExtraction[], layers?: LayerConfig[]): Promise<string | null> {
    const dot = buildProjectOverviewDot(extractions, layers);
    if (!dot) return null;

    const filename = "project-overview.svg";
    const svg = await renderDotToSvg(dot);
    writeFileSync(join(this.diagramDir, filename), svg);

    return `![Project Overview](${this.relativeDir}/${filename})`;
  }

  async renderLayerDependency(extractions: LayerExtraction[], layers?: LayerConfig[]): Promise<string | null> {
    const dot = buildLayerDependencyDot(extractions, layers);
    if (!dot) return null;

    const filename = "layer-dependency.svg";
    const svg = await renderDotToSvg(dot);
    writeFileSync(join(this.diagramDir, filename), svg);

    return `![Layer Dependency](${this.relativeDir}/${filename})`;
  }
}
