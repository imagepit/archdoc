import { Project, type SourceFile } from "ts-morph";
import { join, relative, dirname } from "node:path";
import { existsSync } from "node:fs";
import type { LayerConfig } from "../types/config.js";
import type { LayerExtraction } from "../types/extracted.js";
import { extractClass } from "./class-extractor.js";
import { extractInterface } from "./interface-extractor.js";
import { extractFunction } from "./function-extractor.js";
import { analyzeImports } from "./import-analyzer.js";
import { analyzeCallChains } from "./call-chain-analyzer.js";

export function createExtractorProject(
  sourceRoot: string,
  tsConfigPath?: string,
): Project {
  const resolvedTsConfig =
    tsConfigPath ??
    (existsSync(join(sourceRoot, "../tsconfig.json"))
      ? join(sourceRoot, "../tsconfig.json")
      : undefined);

  return new Project({
    tsConfigFilePath: resolvedTsConfig,
    skipAddingFilesFromTsConfig: true,
  });
}

export function extractLayer(
  project: Project,
  layer: LayerConfig,
): LayerExtraction {
  const pattern = join(layer.path, "**/*.ts");
  project.addSourceFilesAtPaths(pattern);

  const sourceFiles = project
    .getSourceFiles()
    .filter((sf) => sf.getFilePath().includes(`/${layer.path}/`));

  const result: LayerExtraction = {
    layerName: layer.name,
    classes: [],
    interfaces: [],
    functions: [],
    dependencies: [],
    callChains: [],
  };

  for (const sourceFile of sourceFiles) {
    const category = resolveCategory(sourceFile, layer);

    for (const classDecl of sourceFile.getClasses()) {
      if (classDecl.isExported()) {
        result.classes.push(extractClass(classDecl, category));
      }
    }

    for (const ifaceDecl of sourceFile.getInterfaces()) {
      if (ifaceDecl.isExported()) {
        result.interfaces.push(extractInterface(ifaceDecl, category));
      }
    }

    for (const funcDecl of sourceFile.getFunctions()) {
      if (funcDecl.isExported()) {
        result.functions.push(extractFunction(funcDecl, category));
      }
    }
  }

  result.callChains = analyzeCallChains(sourceFiles);

  return result;
}

function resolveCategory(sourceFile: SourceFile, layer: LayerConfig): string {
  const filePath = sourceFile.getFilePath();
  const relPath = relative(layer.path, filePath);
  const dir = dirname(relPath).split("/")[0];

  if (dir && layer.categories[dir]) {
    return layer.categories[dir];
  }

  for (const [key, label] of Object.entries(layer.categories)) {
    if (relPath.toLowerCase().includes(key.toLowerCase())) {
      return label;
    }
  }

  return "Other";
}
