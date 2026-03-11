import type { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../config/loader.js";
import { createExtractorProject, extractLayer } from "../../extractor/project.js";
import { generateIndexMd } from "../../generator/index-generator.js";
import { generateLayerMd } from "../../generator/layer-generator.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate layer API spec Markdown files")
    .option("-c, --config <path>", "Path to layers.yaml", "layers.yaml")
    .option("-o, --output <dir>", "Output directory", "docs/architecture")
    .option("--layer <name>", "Generate only a specific layer")
    .action(async (options: { config: string; output: string; layer?: string }) => {
      const config = loadConfig(options.config);
      const outputDir = options.output;
      mkdirSync(outputDir, { recursive: true });

      console.log(chalk.blue(`Generating documentation for ${config.project.name}...`));

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

      for (const extraction of extractions) {
        const layerConfig = config.layers.find((l) => l.name === extraction.layerName)!;
        const layerMd = generateLayerMd(layerConfig, extraction);
        const filename = `${layerConfig.name.toLowerCase()}.md`;
        writeFileSync(join(outputDir, filename), layerMd);
        console.log(chalk.green(`  Created ${filename}`));
      }

      console.log(chalk.blue(`\nDone! Documentation written to ${outputDir}/`));
    });
}
