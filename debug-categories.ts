import { loadConfig } from "./src/config/loader.js";
import { createExtractorProject, extractLayer } from "./src/extractor/project.js";

const config = loadConfig("/Users/imagepit/Documents/imagepit/training/api/layers.yaml");
const project = createExtractorProject(config.project.sourceRoot);
const extractions = config.layers.map((l) => extractLayer(project, l));

for (const ext of extractions) {
  const cats = new Map<string, string[]>();
  const all = [...ext.classes, ...ext.interfaces, ...ext.functions];
  for (const item of all) {
    if ("isExported" in item && !item.isExported) continue;
    const key = item.category + (item.subDirectory ? "/" + item.subDirectory : "");
    const arr = cats.get(key) ?? [];
    arr.push(item.name);
    cats.set(key, arr);
  }
  console.log(`=== ${ext.layerName} ===`);
  for (const [cat, names] of cats) {
    console.log(`  [${cat}] ${names.join(", ")}`);
  }
}
