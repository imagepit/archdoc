import { type Project, type Node, SyntaxKind } from "ts-morph";
import type { LayerExtraction, CallerReference } from "../types/extracted.js";
import type { LayerConfig } from "../types/config.js";

/**
 * Post-process: analyze caller references for all methods and functions.
 * Must be called AFTER all layers have been extracted (all source files loaded).
 * Mutates MethodInfo.calledBy and FunctionInfo.calledBy in-place.
 */
export function analyzeCallerReferences(
  project: Project,
  extractions: LayerExtraction[],
  layers?: LayerConfig[],
): void {
  for (const ext of extractions) {
    // Analyze class methods
    for (const cls of ext.classes) {
      const sourceFile = project
        .getSourceFiles()
        .find((sf) => sf.getFilePath() === cls.filePath);
      if (!sourceFile) continue;

      const classDecl = sourceFile.getClass(cls.name);
      if (!classDecl) continue;

      for (const method of cls.methods) {
        const methodDecl = classDecl.getMethod(method.name);
        if (!methodDecl) continue;

        method.calledBy = findCallers(methodDecl, ext.layerName, layers);
      }
    }

    // Analyze standalone functions
    for (const func of ext.functions) {
      const sourceFile = project
        .getSourceFiles()
        .find((sf) => sf.getFilePath() === func.filePath);
      if (!sourceFile) continue;

      const funcDecl = sourceFile.getFunction(func.name);
      if (!funcDecl) continue;

      func.calledBy = findCallers(funcDecl, ext.layerName, layers);
    }
  }
}

function findCallers(
  node: Node,
  selfLayerName: string,
  layers?: LayerConfig[],
): CallerReference[] {
  const callers: CallerReference[] = [];
  const seen = new Set<string>();

  let refNodes: Node[];
  try {
    refNodes = node.findReferencesAsNodes();
  } catch {
    return callers;
  }

  for (const refNode of refNodes) {
    // Skip self-references (definition site)
    if (refNode.getSourceFile() === node.getSourceFile()) {
      const refStart = refNode.getStart();
      const nodeStart = node.getStart();
      const nodeEnd = node.getEnd();
      if (refStart >= nodeStart && refStart <= nodeEnd) continue;
    }

    // Filter: only call expressions (not type refs, imports, etc.)
    if (!isCallSite(refNode)) continue;

    const callerName = resolveCallerName(refNode);
    const filePath = refNode.getSourceFile().getFilePath();
    const layerName = resolveLayerName(filePath, layers);

    const key = `${callerName}:${filePath}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { callType, interfaceName } = resolveCallType(refNode);
    callers.push({ callerName, filePath, layerName, callType, interfaceName });
  }

  return callers;
}

/**
 * Check if a reference node is inside a call expression (actual invocation).
 */
function isCallSite(refNode: Node): boolean {
  let current: Node | undefined = refNode;
  while (current) {
    const kind = current.getKind();

    // Import declarations are not call sites
    if (kind === SyntaxKind.ImportDeclaration) return false;

    // Type references are not call sites
    if (kind === SyntaxKind.TypeReference) return false;

    // Call expression: the reference is part of a function/method call
    if (kind === SyntaxKind.CallExpression) return true;

    // New expression: constructor call
    if (kind === SyntaxKind.NewExpression) return true;

    current = current.getParent();
  }
  return false;
}

/**
 * Walk up the AST from a reference node to find the containing
 * method/function and return a descriptive caller name.
 */
function resolveCallerName(refNode: Node): string {
  let current: Node | undefined = refNode.getParent();
  while (current) {
    const kind = current.getKind();

    if (kind === SyntaxKind.MethodDeclaration) {
      const methodDecl = current.asKind(SyntaxKind.MethodDeclaration)!;
      const classDecl = methodDecl.getParent();
      if (classDecl?.getKind() === SyntaxKind.ClassDeclaration) {
        const className =
          classDecl.asKind(SyntaxKind.ClassDeclaration)?.getName() ??
          "Anonymous";
        return `${className}.${methodDecl.getName()}()`;
      }
      return `${methodDecl.getName()}()`;
    }

    if (kind === SyntaxKind.FunctionDeclaration) {
      const funcDecl = current.asKind(SyntaxKind.FunctionDeclaration)!;
      return `${funcDecl.getName() ?? "anonymous"}()`;
    }

    if (kind === SyntaxKind.ArrowFunction || kind === SyntaxKind.FunctionExpression) {
      // Check if assigned to a variable
      const parent = current.getParent();
      if (parent?.getKind() === SyntaxKind.VariableDeclaration) {
        const varDecl = parent.asKind(SyntaxKind.VariableDeclaration);
        if (varDecl) return `${varDecl.getName()}()`;
      }
    }

    if (kind === SyntaxKind.Constructor) {
      const classDecl = current.getParent();
      if (classDecl?.getKind() === SyntaxKind.ClassDeclaration) {
        const className =
          classDecl.asKind(SyntaxKind.ClassDeclaration)?.getName() ??
          "Anonymous";
        return `${className}.constructor()`;
      }
    }

    current = current.getParent();
  }

  // Top-level module scope
  const fileName = refNode.getSourceFile().getBaseName().replace(/\.ts$/, "");
  return `(module) ${fileName}`;
}

/**
 * Determine if a call is through an interface or a direct concrete reference.
 * Checks the type of the expression left of the dot in a property access.
 */
function resolveCallType(refNode: Node): {
  callType: "direct" | "interface";
  interfaceName?: string;
} {
  const parent = refNode.getParent();
  if (parent?.getKind() !== SyntaxKind.PropertyAccessExpression) {
    return { callType: "direct" };
  }

  const propAccess = parent.asKind(SyntaxKind.PropertyAccessExpression)!;
  const expr = propAccess.getExpression();
  const type = expr.getType();
  const symbol = type.getSymbol() ?? type.getAliasSymbol();

  if (symbol) {
    const declarations = symbol.getDeclarations();
    if (declarations) {
      const ifaceDecl = declarations.find(
        (d) => d.getKind() === SyntaxKind.InterfaceDeclaration,
      );
      if (ifaceDecl) {
        return { callType: "interface", interfaceName: symbol.getName() };
      }
    }
  }

  return { callType: "direct" };
}

/**
 * Determine which layer a file belongs to based on its path.
 */
function resolveLayerName(
  filePath: string,
  layers?: LayerConfig[],
): string | undefined {
  if (!layers) return undefined;
  for (const layer of layers) {
    if (filePath.includes(`/${layer.path}/`)) {
      return layer.name;
    }
  }
  return undefined;
}
