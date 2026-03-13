import type { SourceFile } from "ts-morph";
import type { DependencyInfo } from "../types/extracted.js";
import type { LayerConfig } from "../types/config.js";

export function analyzeImports(
  sourceFile: SourceFile,
  layers: LayerConfig[],
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const filePath = sourceFile.getFilePath();

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    const targetLayer = layers.find((layer) => {
      const resolvedPath = importDecl.getModuleSpecifierSourceFile()?.getFilePath();
      if (resolvedPath) {
        return resolvedPath.includes(`/${layer.path}/`);
      }
      return moduleSpecifier.includes(layer.path);
    });

    if (targetLayer) {
      const sourceLayer = layers.find(
        (layer) => filePath.includes(`/${layer.path}/`),
      );

      if (sourceLayer && sourceLayer.name !== targetLayer.name) {
        deps.push({
          source: sourceLayer.name,
          target: targetLayer.name,
          type: "import",
          sourceFile: filePath,
          importPath: moduleSpecifier,
        });
      }
    }
  }

  return deps;
}

export function findForbiddenImports(
  sourceFile: SourceFile,
  currentLayer: LayerConfig,
  layers: LayerConfig[],
): DependencyInfo[] {
  const allDeps = analyzeImports(sourceFile, layers);
  return allDeps
    .filter((dep) => {
      const targetLayer = layers.find((l) => l.name === dep.target);
      if (!targetLayer) return false;
      return currentLayer.forbiddenImports.some(
        (forbidden) => targetLayer.path === forbidden || targetLayer.path.startsWith(forbidden),
      );
    })
    .map((dep) => ({ ...dep, isForbidden: true }));
}
