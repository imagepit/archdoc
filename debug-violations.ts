import { loadConfig } from "./src/config/loader.js";
import { createExtractorProject, extractLayer } from "./src/extractor/project.js";
import { buildProjectOverviewDot } from "./src/diagram/project-overview-builder.js";

const config = loadConfig("/Users/imagepit/Documents/imagepit/training/api/layers.yaml");
const project = createExtractorProject(config.project.sourceRoot);
const extractions = config.layers.map((l) => extractLayer(project, l, config.layers));

// Show allowed dependency rules
console.log("=== Dependency Rules ===");
for (const layer of config.layers) {
  const deps = layer.dependsOn ?? `(inferred from type: ${layer.type})`;
  console.log(`  ${layer.name}: dependsOn = ${JSON.stringify(deps)}`);
}

// Generate DOT and extract violation lines
const dot = buildProjectOverviewDot(extractions, config.layers);
const lines = dot.split("\n");
const violationLines = lines.filter(l => l.includes("->") && l.includes("label=") && !l.includes("invis"));

console.log(`\n=== Violations: ${violationLines.length} ===`);
for (const line of violationLines) {
  console.log("  " + line.trim());
}

if (violationLines.length === 0) {
  console.log("  (No violations detected)");
}

// Show import-level forbidden dependencies
console.log("\n=== Import-level Forbidden Dependencies ===");
for (const ext of extractions) {
  const forbidden = ext.dependencies.filter((d) => d.isForbidden);
  if (forbidden.length > 0) {
    console.log(`  ${ext.layerName}:`);
    for (const dep of forbidden) {
      const file = dep.sourceFile?.split("/").pop() ?? "?";
      console.log(`    ${file} → ${dep.importPath} (target: ${dep.target})`);
    }
  }
}
