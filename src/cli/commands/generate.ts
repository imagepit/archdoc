import type { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../config/loader.js";
import { createExtractorProject, extractLayer } from "../../extractor/project.js";
import { generateIndexMd } from "../../generator/index-generator.js";
import { generateLayerMd } from "../../generator/layer-generator.js";
import { buildLayerDotDiagram } from "../../diagram/dot-class-builder.js";
import { renderDotToSvg } from "../../diagram/svg-renderer.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type DiagramFormat = "mermaid" | "svg";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate layer API spec Markdown files")
    .option("-c, --config <path>", "Path to layers.yaml", "layers.yaml")
    .option("-o, --output <dir>", "Output directory", "docs/architecture")
    .option("--layer <name>", "Generate only a specific layer")
    .option("-d, --diagram <format>", "Diagram format: mermaid or svg (default: mermaid)", "mermaid")
    .action(async (options: { config: string; output: string; layer?: string; diagram: string }) => {
      const diagramFormat = options.diagram as DiagramFormat;
      if (diagramFormat !== "mermaid" && diagramFormat !== "svg") {
        console.error(chalk.red(`Invalid diagram format "${options.diagram}". Use "mermaid" or "svg".`));
        process.exit(1);
      }

      const config = loadConfig(options.config);
      const outputDir = options.output;
      mkdirSync(outputDir, { recursive: true });

      console.log(chalk.blue(`Generating documentation for ${config.project.name}...`));
      console.log(chalk.gray(`  Diagram format: ${diagramFormat}`));

      const project = createExtractorProject(config.project.sourceRoot);
      const targetLayers = options.layer
        ? config.layers.filter((l) => l.name === options.layer)
        : config.layers;

      if (targetLayers.length === 0) {
        console.error(chalk.red(`Layer "${options.layer}" not found in config`));
        process.exit(1);
      }

      const extractions = targetLayers.map((layer) => {
        console.log(chalk.gray(`  Extracting ${layer.name} (${layer.nameJa})...`));
        return extractLayer(project, layer);
      });

      const indexMd = generateIndexMd(config, extractions);
      writeFileSync(join(outputDir, "index.md"), indexMd);
      console.log(chalk.green(`  Created index.md`));

      // Generate SVG diagrams
      if (diagramFormat === "svg") {
        const diagramDir = join(outputDir, "diagrams");
        mkdirSync(diagramDir, { recursive: true });

        for (const extraction of extractions) {
          const dot = buildLayerDotDiagram(extraction);
          if (dot) {
            const svgFilename = `${extraction.layerName.toLowerCase()}-class.svg`;
            const svg = await renderDotToSvg(dot);
            writeFileSync(join(diagramDir, svgFilename), svg);
            console.log(chalk.green(`  Created diagrams/${svgFilename}`));
          }
        }
      }

      for (const extraction of extractions) {
        const layerConfig = config.layers.find((l) => l.name === extraction.layerName)!;
        const layerMd = generateLayerMd(layerConfig, extraction, { svg: diagramFormat === "svg" });
        const filename = `${layerConfig.name.toLowerCase()}.md`;
        writeFileSync(join(outputDir, filename), layerMd);
        console.log(chalk.green(`  Created ${filename}`));
      }

      console.log(chalk.blue(`\nDone! Documentation written to ${outputDir}/`));
    });
}
