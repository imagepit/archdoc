import type { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../config/loader.js";
import { createExtractorProject, extractLayer } from "../../extractor/project.js";
import { analyzeCallerReferences } from "../../extractor/caller-analyzer.js";
import { classifyDddRoles, checkDddWarnings } from "../../analyzer/ddd-analyzer.js";
import { generateIndexMd } from "../../generator/index-generator.js";
import { generateLayerMd } from "../../generator/layer-generator.js";
import { detectLayerCycles } from "../../analyzer/cycle-detector.js";
import { checkResponsibilitySeparation } from "../../analyzer/nextjs-responsibility-checker.js";
import { MermaidRenderer } from "../../diagram/mermaid-renderer.js";
import { SvgRenderer } from "../../diagram/svg-renderer.js";
import type { DiagramRenderer } from "../../diagram/diagram-renderer.js";
import { getMessages } from "../../i18n/index.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type DiagramFormat = "mermaid" | "svg";

/**
 * ドキュメント生成用の'generate'サブコマンドを登録する。
 * @param program - Commanderプログラム
 */
export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate layer API spec Markdown files")
    .option("-c, --config <path>", "Path to layers.yaml", "layers.yaml")
    .option("-o, --output <dir>", "Output directory", "docs/architecture")
    .option("--layer <name>", "Generate only a specific layer")
    .option("-d, --diagram <format>", "Diagram format: mermaid or svg (default: svg)", "svg")
    .option("--cytoscape", "Generate interactive Cytoscape.js component graph")
    .action(async (options: { config: string; output: string; layer?: string; diagram: string; cytoscape?: boolean }) => {
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
        return extractLayer(project, layer, config.layers, config.project.sourceRoot);
      });

      // Post-process: analyze caller references across all layers
      console.log(chalk.gray("  Analyzing caller references..."));
      analyzeCallerReferences(project, extractions, config.layers);

      // DDD analysis: classify roles and check structural warnings
      for (const extraction of extractions) {
        const layerConfig = config.layers.find((l) => l.name === extraction.layerName)!;
        classifyDddRoles(extraction, layerConfig.type);
        extraction.dddWarnings = checkDddWarnings(extraction, layerConfig.type);
        if (extraction.dddWarnings.length > 0) {
          console.log(chalk.yellow(`  ${extraction.layerName}: ${extraction.dddWarnings.length} DDD warning(s)`));
        }
      }

      // Create renderer based on diagram format
      const renderer: DiagramRenderer = diagramFormat === "svg"
        ? new SvgRenderer(join(outputDir, "diagrams"), "diagrams")
        : new MermaidRenderer();

      // Detect circular layer dependencies
      const layerCycles = detectLayerCycles(extractions);
      if (layerCycles.length > 0) {
        console.log(chalk.yellow(`  ${layerCycles.length} circular dependency(ies) detected`));
      }

      // Next.js responsibility separation check
      const appLayer = config.layers.find((l) => l.name === "App" || l.path.endsWith("/app") || l.path.endsWith("/app/"));
      const infraLayer = config.layers.find((l) => l.type === "infrastructure");
      const domainLayer = config.layers.find((l) => l.type === "domain");
      let responsibilityViolations;
      if (appLayer) {
        const appSourceFiles = project.getSourceFiles().filter((sf) => sf.getFilePath().includes(`/${appLayer.path}/`));
        responsibilityViolations = checkResponsibilitySeparation(appSourceFiles, {
          appLayerPath: appLayer.path,
          infraLayerPath: infraLayer?.path,
          domainLayerPath: domainLayer?.path,
        });
        if (responsibilityViolations.length > 0) {
          console.log(chalk.yellow(`  ${responsibilityViolations.length} responsibility violation(s) detected`));
        }
      }

      const messages = getMessages(config.project.locale ?? "en");

      const indexMd = await generateIndexMd(config, extractions, { renderer, messages, layerCycles, responsibilityViolations, cytoscape: options.cytoscape });
      writeFileSync(join(outputDir, "index.md"), indexMd);
      console.log(chalk.green(`  Created index.md`));

      for (const extraction of extractions) {
        const layerConfig = config.layers.find((l) => l.name === extraction.layerName)!;
        const layerNames = config.layers.map((l) => l.name);
        const layerMd = await generateLayerMd(layerConfig, extraction, { renderer, layerNames, messages });
        const filename = `${layerConfig.name.toLowerCase()}.md`;
        writeFileSync(join(outputDir, filename), layerMd);
        console.log(chalk.green(`  Created ${filename}`));
      }

      console.log(chalk.blue(`\nDone! Documentation written to ${outputDir}/`));
    });
}
