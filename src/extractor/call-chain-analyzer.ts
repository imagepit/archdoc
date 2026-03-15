import type { ClassDeclaration, FunctionDeclaration, SourceFile } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import type { ClassCallChain, ConstructorDep, MethodCall, MethodCallChain } from "../types/extracted.js";

export type { ClassCallChain, ConstructorDep, MethodCall, MethodCallChain };

export function analyzeCallChains(sourceFiles: SourceFile[]): ClassCallChain[] {
  const results: ClassCallChain[] = [];

  for (const file of sourceFiles) {
    for (const classDecl of file.getClasses()) {
      if (!classDecl.isExported()) continue;
      const chain = analyzeClassCallChain(classDecl);
      if (chain.constructorDeps.length > 0 && chain.methods.length > 0) {
        results.push(chain);
      }
    }
  }

  return results;
}

function analyzeClassCallChain(classDecl: ClassDeclaration): ClassCallChain {
  const constructorDeps = extractConstructorDeps(classDecl);
  const depNames = new Set(constructorDeps.map((d) => d.paramName));

  const methods: MethodCallChain[] = [];
  for (const method of classDecl.getMethods()) {
    if (method.getName().startsWith("_")) continue;

    const calls = extractMethodCalls(method, depNames);
    if (calls.length > 0) {
      methods.push({
        methodName: method.getName(),
        calls,
      });
    }
  }

  return {
    className: classDecl.getName() ?? "Anonymous",
    filePath: classDecl.getSourceFile().getFilePath(),
    constructorDeps,
    methods,
  };
}

function extractConstructorDeps(classDecl: ClassDeclaration): ConstructorDep[] {
  const deps: ConstructorDep[] = [];

  const ctor = classDecl.getConstructors()[0];
  if (!ctor) return deps;

  for (const param of ctor.getParameters()) {
    const typeNode = param.getTypeNode();
    if (!typeNode) continue;

    const typeName = typeNode.getText();
    if (typeName === "string" || typeName === "number" || typeName === "boolean") {
      continue;
    }

    deps.push({
      paramName: param.getName(),
      typeName: cleanTypeName(typeName),
    });
  }

  return deps;
}

function extractMethodCalls(
  method: import("ts-morph").MethodDeclaration,
  depNames: Set<string>,
): MethodCall[] {
  const calls: MethodCall[] = [];
  const seen = new Set<string>();

  const callExprs = method.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  );

  for (const callExpr of callExprs) {
    const expr = callExpr.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

    const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
    if (!propAccess) continue;

    const methodName = propAccess.getName();
    const obj = propAccess.getExpression();

    // Pattern: this.dep.method()
    if (obj.getKind() === SyntaxKind.PropertyAccessExpression) {
      const outerProp = obj.asKind(SyntaxKind.PropertyAccessExpression);
      if (!outerProp) continue;

      const outerObj = outerProp.getExpression();
      if (outerObj.getKind() === SyntaxKind.ThisKeyword) {
        const depName = outerProp.getName();
        if (depNames.has(depName)) {
          const key = `${depName}.${methodName}`;
          if (!seen.has(key)) {
            seen.add(key);
            calls.push({ target: depName, method: methodName });
          }
        }
      }
    }
  }

  return calls;
}

export function analyzeFunctionCallChains(sourceFiles: SourceFile[]): ClassCallChain[] {
  const results: ClassCallChain[] = [];

  for (const file of sourceFiles) {
    for (const func of file.getFunctions()) {
      if (!func.isExported()) continue;
      const chain = analyzeFunctionCallChain(func);
      if (chain.constructorDeps.length > 0 && chain.methods.length > 0) {
        results.push(chain);
      }
    }
  }

  return results;
}

function analyzeFunctionCallChain(func: FunctionDeclaration): ClassCallChain {
  const deps = extractFunctionParamDeps(func);
  const depNames = new Set(deps.map((d) => d.paramName));

  const calls = extractFunctionBodyCalls(func, depNames);

  const methods: MethodCallChain[] = [];
  if (calls.length > 0) {
    methods.push({
      methodName: func.getName() ?? "anonymous",
      calls,
    });
  }

  return {
    className: func.getName() ?? "anonymous",
    filePath: func.getSourceFile().getFilePath(),
    constructorDeps: deps,
    methods,
  };
}

function extractFunctionParamDeps(func: FunctionDeclaration): ConstructorDep[] {
  const PRIMITIVE_TYPES = new Set(["string", "number", "boolean", "void", "undefined", "null", "never", "unknown", "any"]);
  const deps: ConstructorDep[] = [];

  for (const param of func.getParameters()) {
    const typeNode = param.getTypeNode();
    if (!typeNode) continue;

    const typeName = typeNode.getText();
    if (PRIMITIVE_TYPES.has(typeName)) continue;
    // Skip array/union/literal types
    if (typeName.includes("[") || typeName.includes("|") || typeName.includes("\"") || typeName.includes("'")) continue;

    deps.push({
      paramName: param.getName(),
      typeName: cleanTypeName(typeName),
    });
  }

  return deps;
}

function extractFunctionBodyCalls(
  func: FunctionDeclaration,
  depNames: Set<string>,
): MethodCall[] {
  const calls: MethodCall[] = [];
  const seen = new Set<string>();

  const callExprs = func.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExprs) {
    const expr = callExpr.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

    const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
    if (!propAccess) continue;

    const methodName = propAccess.getName();
    const obj = propAccess.getExpression();

    // Pattern: param.method() (direct identifier call)
    if (obj.getKind() === SyntaxKind.Identifier) {
      const paramName = obj.getText();
      if (depNames.has(paramName)) {
        const key = `${paramName}.${methodName}`;
        if (!seen.has(key)) {
          seen.add(key);
          calls.push({ target: paramName, method: methodName });
        }
      }
    }
  }

  return calls;
}

function cleanTypeName(typeName: string): string {
  return typeName.replace(/^readonly\s+/, "").trim();
}
