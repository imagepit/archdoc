import type { Command } from "commander";
import chalk from "chalk";
import fg from "fast-glob";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { basename, relative, join } from "node:path";
import yaml from "js-yaml";
import type { LayerType } from "../../types/config.js";

const KNOWN_LAYER_DIRS: Record<string, { type: LayerType; nameJa: string }> = {
  domain: { type: "domain", nameJa: "ドメイン層" },
  application: { type: "application", nameJa: "アプリケーション層" },
  presentation: { type: "presentation", nameJa: "プレゼンテーション層" },
  infrastructure: { type: "infrastructure", nameJa: "インフラストラクチャ層" },
  usecase: { type: "application", nameJa: "ユースケース層" },
  usecases: { type: "application", nameJa: "ユースケース層" },
  adapter: { type: "infrastructure", nameJa: "アダプタ層" },
  adapters: { type: "infrastructure", nameJa: "アダプタ層" },
  controller: { type: "presentation", nameJa: "コントローラ層" },
  controllers: { type: "presentation", nameJa: "コントローラ層" },
  api: { type: "presentation", nameJa: "API層" },
};

const KNOWN_CATEGORIES: Record<string, string> = {
  entities: "Entity",
  entity: "Entity",
  valueObjects: "Value Object",
  "value-objects": "Value Object",
  repositories: "Repository Interface",
  repository: "Repository Interface",
  services: "Domain Service",
  service: "Domain Service",
  usecases: "Use Case",
  usecase: "Use Case",
  "use-cases": "Use Case",
  controllers: "Controller",
  handlers: "Handler",
  models: "Model",
};

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize layers.yaml configuration")
    .option("--discover", "Auto-discover layers from directory structure")
    .option("-s, --source <dir>", "Source root directory", "src")
    .option("-o, --output <path>", "Output path for layers.yaml", "layers.yaml")
    .action(async (options: { discover: boolean; source: string; output: string }) => {
      if (existsSync(options.output)) {
        console.error(chalk.red(`${options.output} already exists. Remove it first.`));
        process.exit(1);
      }

      if (options.discover) {
        console.log(chalk.blue(`Discovering layers from ${options.source}/...`));
        const config = discoverLayers(options.source);
        const yamlStr = yaml.dump(config, { lineWidth: 120, noRefs: true });
        writeFileSync(options.output, yamlStr);
        console.log(chalk.green(`Created ${options.output}`));
        console.log(chalk.gray("Review and edit the file to match your architecture."));
      } else {
        const config = createMinimalConfig();
        const yamlStr = yaml.dump(config, { lineWidth: 120, noRefs: true });
        writeFileSync(options.output, yamlStr);
        console.log(chalk.green(`Created ${options.output} with minimal template`));
        console.log(chalk.gray("Edit the file to define your layers."));
      }
    });
}

const DEFAULT_FORBIDDEN_IMPORTS: Partial<Record<LayerType, string[]>> = {
  domain: ["src/infrastructure", "src/presentation"],
  application: ["src/infrastructure", "src/presentation"],
};

function discoverLayers(sourceRoot: string): object {
  const dirs = fg.sync(`${sourceRoot}/*/`, { onlyDirectories: true, deep: 1 });
  const layers = [];

  for (const dir of dirs) {
    const dirName = basename(dir);
    const known = KNOWN_LAYER_DIRS[dirName.toLowerCase()];
    const layerType: LayerType = known?.type ?? "custom";
    const layerNameJa = known?.nameJa ?? `${capitalize(dirName)}層`;

    const cleanDir = dir.replace(/\/$/, "");
    const subDirs = fg.sync(`${cleanDir}/*/`, { onlyDirectories: true, deep: 1 });
    const categories: Record<string, string> = {};
    for (const subDir of subDirs) {
      const subName = basename(subDir);
      const cat = KNOWN_CATEGORIES[subName.toLowerCase()];
      categories[subName] = cat ?? capitalize(subName);
    }

    layers.push({
      name: capitalize(dirName),
      nameJa: layerNameJa,
      path: relative(".", dir).replace(/\/$/, ""),
      type: layerType,
      description: `TODO: ${layerNameJa}の説明を記載`,
      responsibility: `TODO: ${layerNameJa}の責務を記載`,
      forbiddenImports: DEFAULT_FORBIDDEN_IMPORTS[layerType] ?? [],
      categories,
    });
  }

  return {
    project: {
      name: resolveProjectName(),
      description: "TODO: Project description",
      sourceRoot,
    },
    layers,
  };
}

function resolveProjectName(): string {
  const pkgPath = join(process.cwd(), "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name) return pkg.name;
    } catch { /* ignore parse errors */ }
  }
  return "TODO: Project Name";
}

function createMinimalConfig(): object {
  return {
    project: {
      name: "My Project",
      description: "Project description",
      sourceRoot: "src",
    },
    layers: [
      {
        name: "Domain",
        nameJa: "ドメイン層",
        path: "src/domain",
        type: "domain",
        description: "Business rules and domain models",
        responsibility: "Define business rules and domain models",
        forbiddenImports: ["src/infrastructure", "src/presentation"],
        categories: {
          entities: "Entity",
          valueObjects: "Value Object",
          repositories: "Repository Interface",
          services: "Domain Service",
        },
      },
    ],
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
