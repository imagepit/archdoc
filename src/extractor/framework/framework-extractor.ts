import type { SourceFile } from "ts-morph";
import type { RouteInfo, FunctionInfo } from "../../types/extracted.js";

export interface FrameworkExtractor {
  extractRoutes(sourceFile: SourceFile, funcName: string): RouteInfo[];

  /**
   * Post-processing step: resolve app.use() / router.use() mount patterns
   * and prepend prefixes to sub-router routes.
   * @param layerSourceFiles - Source files within the layer being extracted
   * @param allSourceFiles - All source files in the project (to detect app.use() in app.ts etc.)
   * @param functions - Extracted functions whose routes will be updated
   */
  resolveMountPrefixes(
    layerSourceFiles: SourceFile[],
    allSourceFiles: SourceFile[],
    functions: FunctionInfo[],
  ): void;
}
