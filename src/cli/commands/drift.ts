import type { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../config/loader.js";
import { createExtractorProject, extractLayer } from "../../extractor/project.js";
import { loadSpec, saveSpec } from "../../drift/spec-store.js";
import { compareSpecs } from "../../drift/spec-comparator.js";
import { formatDriftReport } from "../../drift/drift-reporter.js";

export function registerDriftCommand(program: Command): void {
  program
    .command("drift")
    .description("Detect spec drift between design and implementation")
    .option("-c, --config <path>", "Path to layers.yaml", "layers.yaml")
    .option("--baseline", "Save current implementation as baseline")
    .option("--layer <name>", "Check only a specific layer")
    .action(async (options: { config: string; baseline: boolean; layer?: string }) => {
      const config = loadConfig(options.config);
      const project = createExtractorProject(config.project.sourceRoot);

      const targetLayers = options.layer
        ? config.layers.filter((l) => l.name === options.layer)
        : config.layers;

      if (options.baseline) {
        console.log(chalk.blue("Saving current implementation as baseline..."));
        for (const layer of targetLayers) {
          const extraction = extractLayer(project, layer);
          saveSpec(layer.name, extraction);
          console.log(chalk.green(`  Saved baseline for ${layer.name}`));
        }
        console.log(chalk.blue("Done! Baseline saved to .archdoc/"));
        return;
      }

      let hasDrift = false;
      for (const layer of targetLayers) {
        const baseline = loadSpec(layer.name);
        if (!baseline) {
          console.log(
            chalk.yellow(
              `  No baseline for ${layer.name}. Run "archdoc drift --baseline" first.`,
            ),
          );
          continue;
        }

        const current = extractLayer(project, layer);
        const result = compareSpecs(layer.name, baseline, current);

        if (result.hasDrift) {
          hasDrift = true;
          console.log(formatDriftReport(result));
        } else {
          console.log(chalk.green(`  ${layer.name}: No drift detected`));
        }
      }

      if (hasDrift) {
        process.exit(1);
      }
    });
}
