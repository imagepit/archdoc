import {
  type SourceFile,
  type FunctionDeclaration,
  type CallExpression,
  type Node,
  SyntaxKind,
} from "ts-morph";
import type { RouteInfo, RouteCallInfo, RouteJSDocTag, FunctionInfo } from "../../types/extracted.js";
import type { FrameworkExtractor } from "./framework-extractor.js";

const HTTP_METHODS = new Set(["get", "post", "put", "delete", "patch"]);

/** FrameworkExtractorを実装するExpress.jsルート抽出器。 */
export class ExpressExtractor implements FrameworkExtractor {
  extractRoutes(sourceFile: SourceFile, funcName: string): RouteInfo[] {
    const funcDecl = sourceFile.getFunction(funcName);
    if (!funcDecl) return [];

    const varTypeMap = buildVarTypeMap(funcDecl);
    const routes: RouteInfo[] = [];

    for (const callExpr of funcDecl.getDescendantsOfKind(
      SyntaxKind.CallExpression,
    )) {
      const route = parseRouterCall(callExpr, varTypeMap);
      if (route) routes.push(route);
    }

    return routes;
  }

  resolveMountPrefixes(
    layerSourceFiles: SourceFile[],
    allSourceFiles: SourceFile[],
    functions: FunctionInfo[],
  ): void {
    // Build mount graph: routerFuncName → { prefix, parentFuncName }
    const mountGraph = new Map<string, { prefix: string; parentFuncName: string }>();

    for (const sourceFile of allSourceFiles) {
      for (const funcDecl of sourceFile.getFunctions()) {
        const parentName = funcDecl.getName() ?? "";
        for (const callExpr of funcDecl.getDescendantsOfKind(
          SyntaxKind.CallExpression,
        )) {
          const mount = parseRouterUse(callExpr);
          if (mount) {
            mountGraph.set(mount.routerFuncName, {
              prefix: mount.prefix,
              parentFuncName: parentName,
            });
          }
        }
      }
    }

    // Resolve full prefix by walking up the mount chain
    const resolveFullPrefix = (funcName: string): string => {
      const parts: string[] = [];
      let current = funcName;
      const visited = new Set<string>();
      while (mountGraph.has(current) && !visited.has(current)) {
        visited.add(current);
        const entry = mountGraph.get(current)!;
        parts.unshift(entry.prefix);
        current = entry.parentFuncName;
      }
      return parts.reduce((acc, part) => joinPaths(acc, part === "/" ? "/" : part), "");
    };

    // Apply resolved prefixes to sub-router routes
    for (const func of functions) {
      if (func.routes && func.routes.length > 0 && mountGraph.has(func.name)) {
        const fullPrefix = resolveFullPrefix(func.name);
        if (fullPrefix) {
          for (const route of func.routes) {
            route.path = joinPaths(fullPrefix, route.path);
          }
        }
      }
    }
  }
}

/**
 * 変数名からコンストラクタ型名へのマップを構築する。
 * `const x = new TypeName(...)` パターンにマッチする。
 * @param funcDecl - 解析対象の関数宣言ノード
 * @returns 変数名と型名のマッピング
 */
function buildVarTypeMap(
  funcDecl: FunctionDeclaration,
): Map<string, string> {
  const map = new Map<string, string>();

  for (const varDecl of funcDecl.getDescendantsOfKind(
    SyntaxKind.VariableDeclaration,
  )) {
    const init = varDecl.getInitializer();
    if (!init || init.getKind() !== SyntaxKind.NewExpression) continue;

    const newExpr = init.asKind(SyntaxKind.NewExpression);
    if (!newExpr) continue;

    const typeName = newExpr.getExpression().getText();
    map.set(varDecl.getName(), typeName);
  }

  return map;
}

/**
 * `router.METHOD('/path', ...middlewares, handler)` 形式の呼び出しを解析する。
 * @param callExpr - 解析対象の呼び出し式ノード
 * @param varTypeMap - 変数名と型名のマッピング
 * @returns 解析されたルート情報、またはルートでない場合はnull
 */
function parseRouterCall(
  callExpr: CallExpression,
  varTypeMap: Map<string, string>,
): RouteInfo | null {
  const expr = callExpr.getExpression();
  if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return null;

  const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
  if (!propAccess) return null;

  const methodName = propAccess.getName().toLowerCase();
  if (!HTTP_METHODS.has(methodName)) return null;

  // Verify it's called on a Router-typed variable
  const obj = propAccess.getExpression();
  const objType = obj.getType();
  const typeName = objType.getSymbol()?.getName() ?? "";
  if (typeName !== "Router" && typeName !== "IRouter") {
    // Also check text-based fallback for common patterns
    const objText = obj.getText();
    if (objText !== "router") return null;
  }

  const args = callExpr.getArguments();
  if (args.length === 0) return null;

  // First argument is the path string
  const pathArg = args[0];
  const path = extractStringLiteral(pathArg);
  if (!path) return null;

  // Last argument is the handler, middle arguments are middlewares
  const middlewares: string[] = [];
  let handlerNode: Node | undefined;

  if (args.length >= 2) {
    handlerNode = args[args.length - 1];
    for (let i = 1; i < args.length - 1; i++) {
      const mwName = extractMiddlewareName(args[i]);
      if (mwName) middlewares.push(mwName);
    }
  }

  // Extract JSDoc description and tags from preceding comment
  const jsdoc = extractRouteJSDoc(callExpr);

  // Extract calls from handler body
  const calls = handlerNode
    ? extractHandlerCalls(handlerNode, varTypeMap)
    : [];

  return {
    method: methodName.toUpperCase(),
    path,
    middlewares,
    description: jsdoc.description,
    jsdocTags: jsdoc.tags.length > 0 ? jsdoc.tags : undefined,
    calls,
  };
}

function extractStringLiteral(node: Node): string | null {
  if (node.getKind() === SyntaxKind.StringLiteral) {
    return node.asKind(SyntaxKind.StringLiteral)!.getLiteralValue();
  }
  return null;
}

function extractMiddlewareName(node: Node): string | null {
  if (node.getKind() === SyntaxKind.Identifier) {
    return node.getText();
  }
  // Handle expressions like validateSomething
  if (node.getKind() === SyntaxKind.CallExpression) {
    const callExpr = node.asKind(SyntaxKind.CallExpression)!;
    return callExpr.getExpression().getText();
  }
  return node.getText();
}

/**
 * ハンドラ本体から既知の変数（ユースケース・サービス等）への呼び出しを抽出する。
 * `variable.method()` パターンにマッチする（variableがvarTypeMapに存在する場合）。
 * @param handler - ハンドラのASTノード
 * @param varTypeMap - 変数名と型名のマッピング
 * @returns ルート呼び出し情報配列
 */
function extractHandlerCalls(
  handler: Node,
  varTypeMap: Map<string, string>,
): RouteCallInfo[] {
  const calls: RouteCallInfo[] = [];
  const seen = new Set<string>();

  for (const callExpr of handler.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )) {
    const expr = callExpr.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

    const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
    if (!propAccess) continue;

    const method = propAccess.getName();
    const obj = propAccess.getExpression();
    const varName = obj.getText();

    if (varTypeMap.has(varName)) {
      const key = `${varTypeMap.get(varName)}.${method}`;
      if (!seen.has(key)) {
        seen.add(key);
        calls.push({ target: varTypeMap.get(varName)!, method });
      }
    }
  }

  return calls;
}

/**
 * `router.use('/prefix', createXxxRouter())` パターンを解析する。
 * @param callExpr - 解析対象の呼び出し式ノード
 * @returns マウントプレフィックスとルーター関数名、またはパターン不一致の場合はnull
 */
function parseRouterUse(
  callExpr: CallExpression,
): { prefix: string; routerFuncName: string } | null {
  const expr = callExpr.getExpression();
  if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return null;

  const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
  if (!propAccess || propAccess.getName() !== "use") return null;

  const args = callExpr.getArguments();
  if (args.length < 2) return null;

  // First arg: path string
  const prefix = extractStringLiteral(args[0]);
  if (!prefix) return null;

  // Last arg: createXxxRouter() call
  const routerArg = args[args.length - 1];
  if (routerArg.getKind() !== SyntaxKind.CallExpression) return null;

  const routerCall = routerArg.asKind(SyntaxKind.CallExpression)!;
  const routerFuncName = routerCall.getExpression().getText();

  return { prefix, routerFuncName };
}

function joinPaths(prefix: string, path: string): string {
  const cleanPrefix = prefix.replace(/\/$/, "");
  if (path === "/") return cleanPrefix + "/";
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  return cleanPrefix + cleanPath;
}

/**
 * 直前のコメントブロックからルートの説明とJSDocタグを抽出する。
 * @param callExpr - ルート呼び出し式ノード
 * @returns ルートの説明文とJSDocタグの配列
 */
function extractRouteJSDoc(
  callExpr: CallExpression,
): { description: string | undefined; tags: RouteJSDocTag[] } {
  const empty = { description: undefined, tags: [] };
  const sourceFile = callExpr.getSourceFile();
  const fullText = sourceFile.getFullText();
  const start = callExpr.getStart();

  // Find the last /** ... */ block immediately before the call
  const textBefore = fullText.substring(0, start);
  const allComments = [...textBefore.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  if (allComments.length === 0) return empty;

  const lastComment = allComments[allComments.length - 1];
  // Verify only whitespace between the comment end and the call
  const commentEnd = lastComment.index! + lastComment[0].length;
  const gap = textBefore.substring(commentEnd).trim();
  if (gap.length > 0) return empty;

  const lines = lastComment[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter((l) => l.length > 0);

  const httpPattern = /^(GET|POST|PUT|DELETE|PATCH)\s+\//i;
  const tagPattern = /^@(\w+)\s*(.*)/;
  // Express handler params to exclude from API documentation
  const expressParams = new Set(["req", "res", "next", "request", "response", "_req", "_res"]);
  const descLines: string[] = [];
  const tags: RouteJSDocTag[] = [];

  for (const line of lines) {
    const tagMatch = line.match(tagPattern);
    if (tagMatch) {
      const [, tag, rest] = tagMatch;
      if (tag === "param") {
        // @param name — description  OR  @param name description
        const paramMatch = rest.match(/^(\w+)\s*[-—–]?\s*(.*)/);
        if (paramMatch && !expressParams.has(paramMatch[1])) {
          tags.push({ tag, name: paramMatch[1], description: paramMatch[2] || "" });
        }
      } else if (tag === "returns" || tag === "return") {
        tags.push({ tag: "returns", description: rest.replace(/^[-—–]\s*/, "") });
      } else if (tag === "throws" || tag === "throw") {
        tags.push({ tag: "throws", description: rest.replace(/^[-—–]\s*/, "") });
      }
      continue;
    }
    if (descLines.length === 0 && httpPattern.test(line)) continue;
    descLines.push(line);
  }

  return {
    description: descLines.length > 0 ? descLines.join("\n") : undefined,
    tags,
  };
}
