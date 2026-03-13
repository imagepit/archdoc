import { loadConfig } from "./src/config/loader.js";
import { createExtractorProject, extractLayer } from "./src/extractor/project.js";
import { buildProjectOverviewDot } from "./src/diagram/project-overview-builder.js";
import { renderDotToSvg } from "./src/diagram/svg-renderer.js";
import { writeFileSync } from "node:fs";

const config = loadConfig("/Users/imagepit/Documents/imagepit/training/api/layers.yaml");
const project = createExtractorProject(config.project.sourceRoot);
const extractions = config.layers.map((l) => extractLayer(project, l));

console.log("Extractions:", extractions.length);
for (const ext of extractions) {
  const cls = ext.classes.filter(c => c.isExported).length;
  const iface = ext.interfaces.filter(i => i.isExported).length;
  const func = ext.functions.filter(f => f.isExported).length;
  console.log(`  ${ext.layerName}: ${cls} classes, ${iface} interfaces, ${func} functions`);
}

const dot = buildProjectOverviewDot(extractions, config.layers);
console.log("DOT length:", dot.length);
console.log("DOT first 500:", dot.substring(0, 500));

if (dot.length > 0) {
  try {
    const svg = await renderDotToSvg(dot);
    writeFileSync("/tmp/test-overview.svg", svg);
    console.log("SVG written to /tmp/test-overview.svg");
    const match = svg.match(/viewBox="([^"]+)"/);
    if (match) console.log("viewBox:", match[1]);
  } catch (e) {
    console.error("SVG render error:", e);
    writeFileSync("/tmp/debug-overview.dot", dot);
    console.log("DOT written to /tmp/debug-overview.dot");
  }
} else {
  console.log("Empty DOT - no nodes collected");
}
