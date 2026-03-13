import { loadConfig } from "./src/config/loader.js";
import { createExtractorProject, extractLayer } from "./src/extractor/project.js";
import { buildProjectOverviewDot } from "./src/diagram/project-overview-builder.js";

const config = loadConfig("/Users/imagepit/Documents/imagepit/training/api/layers.yaml");
const project = createExtractorProject(config.project.sourceRoot);
const extractions = config.layers.map((l) => extractLayer(project, l));

console.log("Layer order:", extractions.map((e, i) => `${i}:${e.layerName}(${config.layers[i].type})`).join(", "));

for (const ext of extractions) {
  const cls = ext.classes.filter(c => c.isExported).length;
  const iface = ext.interfaces.filter(i => i.isExported).length;
  const func = ext.functions.filter(f => f.isExported).length;
  console.log(`  ${ext.layerName}: ${cls} classes, ${iface} interfaces, ${func} functions`);
}

// With layers config (strict rule)
const dot = buildProjectOverviewDot(extractions, config.layers);
const violationLines = dot.split("\n").filter(l => l.includes("->") && l.includes("label=") && !l.includes("invis"));
console.log(`\nViolations (strict): ${violationLines.length}`);
for (const line of violationLines) {
  console.log("  " + line.trim());
}

// Without layers config (fallback)
const dotFallback = buildProjectOverviewDot(extractions);
const fallbackLines = dotFallback.split("\n").filter(l => l.includes("->") && l.includes("label=") && !l.includes("invis"));
console.log(`\nViolations (fallback/no config): ${fallbackLines.length}`);
