import { Project, type SourceFile, VariableDeclarationKind, Node } from "ts-morph";
import { join, relative, dirname } from "node:path";
import { existsSync } from "node:fs";
import type { LayerConfig, CategoryOverride } from "../types/config.js";
import type { LayerExtraction } from "../types/extracted.js";
import { extractClass } from "./class-extractor.js";
import { extractInterface } from "./interface-extractor.js";
import { extractFunction } from "./function-extractor.js";
import { extractTypeAlias } from "./type-alias-extractor.js";
import { extractEnum } from "./enum-extractor.js";
import { extractConst } from "./const-extractor.js";
import { analyzeImports, findForbiddenImports } from "./import-analyzer.js";
import { analyzeCallChains, analyzeFunctionCallChains } from "./call-chain-analyzer.js";
import { createFrameworkExtractor } from "./framework/index.js";

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
  allLayers?: LayerConfig[],
  sourceRoot?: string,
): LayerExtraction {
  const pattern = join(layer.path, "**/*.ts");
  project.addSourceFilesAtPaths(pattern);

  // Add sourceRoot-level files (e.g. app.ts) for mount prefix resolution
  if (layer.framework && sourceRoot) {
    project.addSourceFilesAtPaths(join(sourceRoot, "*.ts"));
  }

  const sourceFiles = project
    .getSourceFiles()
    .filter((sf) => sf.getFilePath().includes(`/${layer.path}/`));

  const result: LayerExtraction = {
    layerName: layer.name,
    classes: [],
    interfaces: [],
    functions: [],
    typeAliases: [],
    enums: [],
    constants: [],
    dependencies: [],
    callChains: [],
  };

  const fwExtractor = createFrameworkExtractor(layer.framework);

  for (const sourceFile of sourceFiles) {
    const { category, subDirectory } = resolveCategoryAndSubDir(
      sourceFile,
      layer,
    );

    for (const classDecl of sourceFile.getClasses()) {
      if (classDecl.isExported()) {
        const cls = extractClass(classDecl, category);
        cls.subDirectory = subDirectory;
        cls.category = applyCategoryOverride(cls.name, cls.category, layer.categoryOverrides);
        result.classes.push(cls);
      }
    }

    for (const ifaceDecl of sourceFile.getInterfaces()) {
      if (ifaceDecl.isExported()) {
        const iface = extractInterface(ifaceDecl, category);
        iface.subDirectory = subDirectory;
        iface.category = applyCategoryOverride(iface.name, iface.category, layer.categoryOverrides);
        result.interfaces.push(iface);
      }
    }

    for (const funcDecl of sourceFile.getFunctions()) {
      if (funcDecl.isExported()) {
        const func = extractFunction(funcDecl, category);
        func.subDirectory = subDirectory;
        func.category = applyCategoryOverride(func.name, func.category, layer.categoryOverrides);
        if (fwExtractor) {
          func.routes = fwExtractor.extractRoutes(sourceFile, func.name);
        }
        result.functions.push(func);
      }
    }

    for (const typeDecl of sourceFile.getTypeAliases()) {
      if (typeDecl.isExported()) {
        const ta = extractTypeAlias(typeDecl, category);
        ta.subDirectory = subDirectory;
        ta.category = applyCategoryOverride(ta.name, ta.category, layer.categoryOverrides);
        result.typeAliases.push(ta);
      }
    }

    for (const enumDecl of sourceFile.getEnums()) {
      if (enumDecl.isExported()) {
        const en = extractEnum(enumDecl, category);
        en.subDirectory = subDirectory;
        en.category = applyCategoryOverride(en.name, en.category, layer.categoryOverrides);
        result.enums.push(en);
      }
    }

    for (const varStmt of sourceFile.getVariableStatements()) {
      if (varStmt.isExported() && varStmt.getDeclarationKind() === VariableDeclarationKind.Const) {
        for (const decl of varStmt.getDeclarations()) {
          const init = decl.getInitializer();
          if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) continue;
          const c = extractConst(decl, category);
          c.subDirectory = subDirectory;
          c.category = applyCategoryOverride(c.name, c.category, layer.categoryOverrides);
          result.constants.push(c);
        }
      }
    }

    if (allLayers) {
      const imports = analyzeImports(sourceFile, allLayers);
      const forbidden = findForbiddenImports(sourceFile, layer, allLayers);
      const forbiddenSet = new Set(
        forbidden.map((d) => `${d.sourceFile}:${d.importPath}`),
      );
      for (const dep of imports) {
        dep.isForbidden = forbiddenSet.has(
          `${dep.sourceFile}:${dep.importPath}`,
        );
        result.dependencies.push(dep);
      }
    }
  }

  // Resolve app.use() / router.use() mount prefixes for sub-routers
  if (fwExtractor) {
    const allSourceFiles = project.getSourceFiles();
    fwExtractor.resolveMountPrefixes(sourceFiles, allSourceFiles, result.functions);
  }

  const classChains = analyzeCallChains(sourceFiles);
  const funcChains = analyzeFunctionCallChains(sourceFiles);
  result.callChains = [...classChains, ...funcChains];

  return result;
}

interface CategoryResolution {
  category: string;
  subDirectory: string;
}

function applyCategoryOverride(
  name: string,
  currentCategory: string,
  overrides?: CategoryOverride[],
): string {
  if (!overrides) return currentCategory;
  for (const override of overrides) {
    if (matchGlobPattern(override.pattern, name)) {
      return override.category;
    }
  }
  return currentCategory;
}

function matchGlobPattern(pattern: string, name: string): boolean {
  const regex = new RegExp(
    "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
  );
  return regex.test(name);
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
