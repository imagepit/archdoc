import { instance } from "@viz-js/viz";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { DiagramRenderer } from "./diagram-renderer.js";
import type { LayerExtraction, ClassInfo, InterfaceInfo } from "../types/extracted.js";
import type { ClassCallChain } from "../extractor/call-chain-analyzer.js";
import { buildLayerDotDiagram } from "./dot-class-builder.js";
import { buildSequenceDiagram } from "./sequence-diagram-builder.js";

export async function renderDotToSvg(dotCode: string): Promise<string> {
  const viz = await instance();
  return viz.renderString(dotCode, { format: "svg", engine: "dot" });
}

/**
 * SVG implementation of DiagramRenderer.
 * Generates DOT → SVG files and returns Markdown image references.
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
    const exported = [
      ...classes.filter((c) => c.isExported),
      ...interfaces.filter((i) => i.isExported),
    ];
    if (exported.length === 0) return null;

    const dot = buildDetailDotDiagram(
      classes.filter((c) => c.isExported),
      interfaces.filter((i) => i.isExported),
    );
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
}

/**
 * Build a DOT diagram with full member details for a group of classes/interfaces.
 */
function buildDetailDotDiagram(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string {
  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = [];
  lines.push("digraph {");
  lines.push("  rankdir=TB");
  lines.push("  nodesep=0.4");
  lines.push("  ranksep=0.6");
  lines.push('  node [shape=record, style="filled", fillcolor=white, fontname="Helvetica", fontsize=10]');
  lines.push('  edge [fontname="Helvetica", fontsize=9]');
  lines.push("");

  for (const iface of interfaces) {
    const id = sanitizeId(iface.name);
    const props = iface.properties
      .map((p) => `+ ${escapeLabel(p.name)}: ${escapeLabel(p.type)}`)
      .join("\\l");
    const methods = iface.methods
      .map((m) => `+ ${escapeLabel(m.name)}()`)
      .join("\\l");
    const sections = [
      `{\\<\\<interface\\>\\>\\n${escapeLabel(iface.name)}}`,
      props ? `${props}\\l` : "",
      methods ? `${methods}\\l` : "",
    ]
      .filter(Boolean)
      .join("|");
    lines.push(`  ${id} [label="{${sections}}", style="filled,dashed"]`);
  }

  for (const cls of classes) {
    const id = sanitizeId(cls.name);
    const props = cls.properties
      .map((p) => {
        const vis = p.visibility === "public" ? "+" : p.visibility === "protected" ? "#" : "-";
        return `${vis} ${escapeLabel(p.name)}: ${escapeLabel(p.type)}`;
      })
      .join("\\l");
    const methods = cls.methods
      .map((m) => {
        const vis = m.visibility === "public" ? "+" : m.visibility === "protected" ? "#" : "-";
        return `${vis} ${escapeLabel(m.name)}()`;
      })
      .join("\\l");
    const sections = [
      escapeLabel(cls.name),
      props ? `${props}\\l` : "",
      methods ? `${methods}\\l` : "",
    ]
      .filter(Boolean)
      .join("|");
    lines.push(`  ${id} [label="{${sections}}"]`);
  }

  lines.push("");

  // Relationships
  const allNames = new Set([
    ...classes.map((c) => c.name),
    ...interfaces.map((i) => i.name),
  ]);

  for (const cls of classes) {
    if (cls.extendsClass && allNames.has(cls.extendsClass)) {
      lines.push(`  ${sanitizeId(cls.name)} -> ${sanitizeId(cls.extendsClass)} [arrowhead=empty]`);
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(`  ${sanitizeId(cls.name)} -> ${sanitizeId(impl)} [style=dashed, arrowhead=empty]`);
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(`  ${sanitizeId(iface.name)} -> ${sanitizeId(ext)} [arrowhead=empty]`);
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeLabel(text: string): string {
  return text
    .replace(/"/g, '\\"')
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\|/g, "\\|");
}
