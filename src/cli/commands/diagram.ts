import type { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../config/loader.js";
import { createExtractorProject, extractLayer } from "../../extractor/project.js";
import { buildC4ComponentDiagram } from "../../diagram/c4-builder.js";
import { buildDependencyGraph } from "../../diagram/dependency-graph.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function registerDiagramCommand(program: Command): void {
  program
    .command("diagram")
    .description("Generate Mermaid C4 Component diagram")
    .option("-c, --config <path>", "Path to layers.yaml", "layers.yaml")
    .option("-o, --output <dir>", "Output directory", "docs/architecture")
    .option("--raw", "Output raw .mmd file instead of .md")
    .action(async (options: { config: string; output: string; raw: boolean }) => {
      const config = loadConfig(options.config);
      const project = createExtractorProject(config.project.sourceRoot);

      console.log(chalk.blue("Analyzing dependencies..."));

      const extractions = config.layers.map((layer) => extractLayer(project, layer));
      const graph = buildDependencyGraph(config, extractions);
      const mermaidCode = buildC4ComponentDiagram(config, graph);

      mkdirSync(options.output, { recursive: true });

      if (options.raw) {
        const filepath = join(options.output, "architecture.mmd");
        writeFileSync(filepath, mermaidCode);
        console.log(chalk.green(`Created ${filepath}`));
      } else {
        const md = [
          "---",
          "title: Architecture Diagram",
          `description: ${config.project.name} C4 Component Diagram`,
          "---",
          "",
          `# ${config.project.name} — Architecture Diagram`,
          "",
          "```mermaid",
          mermaidCode,
          "```",
          "",
        ].join("\n");
        const filepath = join(options.output, "diagram.md");
        writeFileSync(filepath, md);
        console.log(chalk.green(`Created ${filepath}`));
      }
    });
}
