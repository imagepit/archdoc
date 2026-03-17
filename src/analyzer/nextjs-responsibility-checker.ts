import type { SourceFile } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import { basename } from "node:path";

/** Severity level for responsibility violations. */
export type ViolationSeverity = "high" | "medium" | "low";

/** Responsibility separation violation detected in a Next.js App Router project. */
export interface ResponsibilityViolation {
  rule: "app-to-infra" | "app-to-domain" | "fetch-in-app" | "di-in-app";
  severity: ViolationSeverity;
  filePath: string;
  detail: string;
  recommendation: string;
}

/** Configuration for the responsibility checker. */
export interface ResponsibilityCheckerConfig {
  /** Layer path for the App layer (e.g. "src/app"). */
  appLayerPath: string;
  /** Layer path for the Infrastructure layer (e.g. "src/infrastructure"). */
  infraLayerPath?: string;
  /** Layer path for the Domain layer (e.g. "src/domain"). */
  domainLayerPath?: string;
}

/**
 * Analyze Next.js App Router source files for responsibility separation violations.
 *
 * Rules:
 * 1. App → Infrastructure direct dependency (high)
 * 2. App → Domain direct dependency, excluding type-only imports (medium)
 * 3. fetch() calls inside App layer files (high)
 * 4. DI assembly (new UseCase/Repository) inside page/layout files (medium)
 */
export function checkResponsibilitySeparation(
  appSourceFiles: SourceFile[],
  config: ResponsibilityCheckerConfig,
): ResponsibilityViolation[] {
  const violations: ResponsibilityViolation[] = [];

  for (const sourceFile of appSourceFiles) {
    const filePath = sourceFile.getFilePath();
    if (!filePath.includes(`/${config.appLayerPath}/`)) continue;

    violations.push(...checkInfraImports(sourceFile, config));
    violations.push(...checkDomainImports(sourceFile, config));
    violations.push(...checkFetchCalls(sourceFile, config));
    violations.push(...checkDiAssembly(sourceFile, config));
  }

  return violations;
}

/**
 * Rule 1: Detect App → Infrastructure direct imports.
 */
function checkInfraImports(
  sourceFile: SourceFile,
  config: ResponsibilityCheckerConfig,
): ResponsibilityViolation[] {
  if (!config.infraLayerPath) return [];
  const violations: ResponsibilityViolation[] = [];
  const filePath = sourceFile.getFilePath();

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpec = importDecl.getModuleSpecifierValue();
    const resolved = importDecl.getModuleSpecifierSourceFile()?.getFilePath();
    const target = resolved ?? moduleSpec;

    if (isInfraPath(target, config.infraLayerPath)) {
      violations.push({
        rule: "app-to-infra",
        severity: "high",
        filePath,
        detail: `imports \`${moduleSpec}\``,
        recommendation: "Route through Application layer UseCase instead of importing Infrastructure directly",
      });
    }
  }

  return violations;
}

/**
 * Rule 2: Detect App → Domain direct imports (excluding type-only imports).
 */
function checkDomainImports(
  sourceFile: SourceFile,
  config: ResponsibilityCheckerConfig,
): ResponsibilityViolation[] {
  if (!config.domainLayerPath) return [];
  const violations: ResponsibilityViolation[] = [];
  const filePath = sourceFile.getFilePath();

  for (const importDecl of sourceFile.getImportDeclarations()) {
    // Skip type-only imports (import type { ... })
    if (importDecl.isTypeOnly()) continue;

    // Skip if all named imports are type-only
    const namedImports = importDecl.getNamedImports();
    if (namedImports.length > 0 && namedImports.every((ni) => ni.isTypeOnly())) continue;

    const moduleSpec = importDecl.getModuleSpecifierValue();
    const resolved = importDecl.getModuleSpecifierSourceFile()?.getFilePath();
    const target = resolved ?? moduleSpec;

    if (isDomainPath(target, config.domainLayerPath)) {
      violations.push({
        rule: "app-to-domain",
        severity: "medium",
        filePath,
        detail: `imports \`${moduleSpec}\``,
        recommendation: "Use Application layer DTOs instead of importing Domain models directly",
      });
    }
  }

  return violations;
}

/**
 * Rule 3: Detect direct fetch() calls in App layer files.
 */
function checkFetchCalls(
  sourceFile: SourceFile,
  config: ResponsibilityCheckerConfig,
): ResponsibilityViolation[] {
  const violations: ResponsibilityViolation[] = [];
  const filePath = sourceFile.getFilePath();
  const fileName = basename(filePath);

  // Only check page/layout/route files and client components
  if (!isAppEntryFile(fileName)) return [];

  for (const callExpr of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const exprText = callExpr.getExpression().getText();
    if (exprText === "fetch") {
      const firstArg = callExpr.getArguments()[0];
      const urlHint = firstArg ? firstArg.getText().slice(0, 50) : "unknown";
      violations.push({
        rule: "fetch-in-app",
        severity: "high",
        filePath,
        detail: `direct fetch() call: ${urlHint}`,
        recommendation: "Delegate data fetching to Infrastructure layer API client or Application layer UseCase",
      });
    }
  }

  return violations;
}

/**
 * Rule 4: Detect DI assembly patterns in page/layout files.
 * e.g. `const repo = createRepository(); const useCase = new UseCase(repo);`
 */
function checkDiAssembly(
  sourceFile: SourceFile,
  config: ResponsibilityCheckerConfig,
): ResponsibilityViolation[] {
  const violations: ResponsibilityViolation[] = [];
  const filePath = sourceFile.getFilePath();
  const fileName = basename(filePath);

  // Only check page and layout files (route.ts is expected to do some wiring)
  if (!isPageOrLayoutFile(fileName)) return [];

  for (const newExpr of sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression)) {
    const typeName = newExpr.getExpression().getText();

    // Detect new XxxUseCase(...) or new XxxRepository(...) patterns
    if (/UseCase$|Repository$|Service$|Interactor$/i.test(typeName)) {
      violations.push({
        rule: "di-in-app",
        severity: "medium",
        filePath,
        detail: `instantiates \`new ${typeName}(...)\``,
        recommendation: "Move DI assembly to a Composition Root or factory module",
      });
    }
  }

  return violations;
}

// --- Path helpers ---

function isInfraPath(path: string, infraLayerPath: string): boolean {
  // Match full path (resolved), path alias (@/infrastructure), or relative path segment
  const dirName = lastSegment(infraLayerPath);
  return path.includes(`/${infraLayerPath}/`)
    || path.includes(`@/${dirName}`)
    || hasPathSegment(path, dirName);
}

function isDomainPath(path: string, domainLayerPath: string): boolean {
  const dirName = lastSegment(domainLayerPath);
  return path.includes(`/${domainLayerPath}/`)
    || path.includes(`@/${dirName}`)
    || hasPathSegment(path, dirName);
}

/** Extract the last path segment (e.g. "src/infrastructure" → "infrastructure"). */
function lastSegment(layerPath: string): string {
  const parts = layerPath.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? layerPath;
}

/** Check if path contains a segment matching the directory name (for relative imports). */
function hasPathSegment(path: string, dirName: string): boolean {
  return path.split("/").includes(dirName);
}

function isAppEntryFile(fileName: string): boolean {
  return /^(page|layout|route|loading|error|not-found)\.(ts|tsx|js|jsx)$/.test(fileName);
}

function isPageOrLayoutFile(fileName: string): boolean {
  return /^(page|layout)\.(ts|tsx|js|jsx)$/.test(fileName);
}
