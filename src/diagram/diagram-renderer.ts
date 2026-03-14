import type { LayerExtraction, ClassInfo, InterfaceInfo, RouteInfo, ClassCallChain } from "../types/extracted.js";
import type { LayerConfig } from "../types/config.js";

/**
 * Strategy interface for diagram rendering.
 * Implementations (MermaidRenderer, SvgRenderer) produce format-specific
 * markdown snippets ready to embed in documentation.
 */
export interface DiagramRenderer {
  /**
   * Render a compact overview class diagram for the entire layer.
   * Shows class/interface names and relationships only (no member details).
   */
  renderLayerOverview(extraction: LayerExtraction): Promise<string | null>;

  /**
   * Render a detailed class diagram for a group of classes/interfaces.
   * Shows full member details (properties, methods) with relationships.
   */
  renderDetailClassDiagram(
    classes: ClassInfo[],
    interfaces: InterfaceInfo[],
  ): Promise<string | null>;

  /**
   * Render a sequence diagram for a class call chain.
   */
  renderSequenceDiagram(chain: ClassCallChain): Promise<string | null>;

  /**
   * Render a sequence diagram for a single route handler call chain.
   */
  renderRouteSequenceDiagram(funcName: string, route: RouteInfo): Promise<string | null>;

  /**
   * Render a cross-layer project overview diagram.
   * Shows all objects grouped by layer. Only dependency violations are drawn.
   */
  renderProjectOverview(extractions: LayerExtraction[], layers?: LayerConfig[]): Promise<string | null>;
}
