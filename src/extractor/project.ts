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
    const { category, subDirectory } = resolveCategoryAndSubDir(
      sourceFile,
      layer,
    );

    for (const classDecl of sourceFile.getClasses()) {
      if (classDecl.isExported()) {
        const cls = extractClass(classDecl, category);
        cls.subDirectory = subDirectory;
        result.classes.push(cls);
      }
    }

    for (const ifaceDecl of sourceFile.getInterfaces()) {
      if (ifaceDecl.isExported()) {
        const iface = extractInterface(ifaceDecl, category);
        iface.subDirectory = subDirectory;
        result.interfaces.push(iface);
      }
    }

    for (const funcDecl of sourceFile.getFunctions()) {
      if (funcDecl.isExported()) {
        const func = extractFunction(funcDecl, category);
        func.subDirectory = subDirectory;
        result.functions.push(func);
      }
    }
  }

  result.callChains = analyzeCallChains(sourceFiles);

  return result;
}

interface CategoryResolution {
  category: string;
  subDirectory: string;
}

function resolveCategoryAndSubDir(
  sourceFile: SourceFile,
  layer: LayerConfig,
): CategoryResolution {
  const filePath = sourceFile.getFilePath();
  const relPath = relative(layer.path, filePath);
  const parts = dirname(relPath).split("/").filter((p) => p !== ".");

  // First directory segment matches a category key
  const dir = parts[0];
  if (dir && layer.categories[dir]) {
    const subDir = parts.length > 1 ? parts.slice(1).join("/") : "";
    return { category: layer.categories[dir], subDirectory: subDir };
  }

  // Fallback: match by substring
  for (const [key, label] of Object.entries(layer.categories)) {
    if (relPath.toLowerCase().includes(key.toLowerCase())) {
      // Find the matching segment index and extract subdirectory after it
      const idx = parts.findIndex((p) =>
        p.toLowerCase().includes(key.toLowerCase()),
      );
      const subDir =
        idx >= 0 && parts.length > idx + 1
          ? parts.slice(idx + 1).join("/")
          : "";
      return { category: label, subDirectory: subDir };
    }
  }

  return { category: "Other", subDirectory: "" };
}
