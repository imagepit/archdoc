import type { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../config/loader.js";
import { createExtractorProject, extractLayer } from "../../extractor/project.js";
import { analyzeCallerReferences } from "../../extractor/caller-analyzer.js";
import { classifyDddRoles, checkDddWarnings } from "../../analyzer/ddd-analyzer.js";
import { generateFeaturesMd } from "../../generator/features-generator.js";
import { getMessages } from "../../i18n/index.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Register the 'features' subcommand for feature list generation.
 */
export function registerFeaturesCommand(program: Command): void {
  program
    .command("features")
    .description("Generate a feature list for comparison with requirements")
    .option("-c, --config <path>", "Path to layers.yaml", "layers.yaml")
    .option("-o, --output <dir>", "Output directory", "docs/architecture")
    .action(async (options: { config: string; output: string }) => {
      const config = loadConfig(options.config);
      const outputDir = options.output;
      mkdirSync(outputDir, { recursive: true });

      console.log(chalk.blue(`Generating feature list for ${config.project.name}...`));

      const project = createExtractorProject(config.project.sourceRoot);

      const extractions = config.layers.map((layer) => {
        console.log(chalk.gray(`  Extracting ${layer.name} (${layer.nameJa})...`));
        return extractLayer(project, layer, config.layers, config.project.sourceRoot);
      });

      console.log(chalk.gray("  Analyzing caller references..."));
      analyzeCallerReferences(project, extractions, config.layers);

      for (const extraction of extractions) {
        const layerConfig = config.layers.find((l) => l.name === extraction.layerName)!;
        classifyDddRoles(extraction, layerConfig.type);
        extraction.dddWarnings = checkDddWarnings(extraction, layerConfig.type);
      }

      const messages = getMessages(config.project.locale ?? "en");
      const featuresMd = generateFeaturesMd(config, extractions, { messages });

      const filename = "features.md";
      writeFileSync(join(outputDir, filename), featuresMd);
      console.log(chalk.green(`  Created ${filename}`));

      console.log(chalk.blue(`\nDone! Feature list written to ${join(outputDir, filename)}`));
    });
}
