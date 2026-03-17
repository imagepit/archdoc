import {
  type SourceFile,
  SyntaxKind,
} from "ts-morph";
import type { RouteInfo, RouteCallInfo, RouteJSDocTag, FunctionInfo } from "../../types/extracted.js";
import type { FrameworkExtractor } from "./framework-extractor.js";

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH"]);

/**
 * Next.js App Router route handler extractor.
 *
 * Detects exported HTTP method functions (GET, POST, etc.) in route.ts files,
 * page.tsx/layout.tsx structure, "use client"/"use server" directives,
 * and Server Action functions.
 */
export class NextjsExtractor implements FrameworkExtractor {
  extractRoutes(sourceFile: SourceFile, funcName: string): RouteInfo[] {
    const filePath = sourceFile.getFilePath();

    // Only extract routes from route.ts/route.tsx files
    if (!isRouteFile(filePath)) return [];

    const funcDecl = sourceFile.getFunction(funcName);
    if (!funcDecl) return [];

    // Check if the function name is an HTTP method export
    if (!HTTP_METHODS.has(funcName)) return [];

    const apiPath = filePathToRoutePath(filePath);
    const jsdoc = extractNextjsRouteJSDoc(sourceFile, funcName);
    const calls = extractHandlerCalls(sourceFile, funcName);

    return [
      {
        method: funcName,
        path: apiPath,
        middlewares: [],
        description: jsdoc.description,
        jsdocTags: jsdoc.tags.length > 0 ? jsdoc.tags : undefined,
        calls,
      },
    ];
  }

  resolveMountPrefixes(
    _layerSourceFiles: SourceFile[],
    _allSourceFiles: SourceFile[],
    _functions: FunctionInfo[],
  ): void {
    // Next.js App Router uses file-system based routing.
    // Paths are derived from directory structure, no mount prefix resolution needed.
  }
}

/**
 * Extract page and layout metadata from a Next.js App Router source file.
 * Returns component type classification: Server Component, Client Component, or Server Action.
 */
export function classifyNextjsComponent(sourceFile: SourceFile): NextjsComponentInfo | null {
  const filePath = sourceFile.getFilePath();
  const fullText = sourceFile.getFullText();

  const isPage = isPageFile(filePath);
  const isLayout = isLayoutFile(filePath);
  const isRoute = isRouteFile(filePath);

  if (!isPage && !isLayout && !isRoute) return null;

  const hasUseClient = /^["']use client["'];?/m.test(fullText);
  const hasUseServer = /^["']use server["'];?/m.test(fullText);

  let componentType: "server" | "client" | "server-action" = "server";
  if (hasUseClient) componentType = "client";
  else if (hasUseServer) componentType = "server-action";

  let fileType: "page" | "layout" | "route" = "route";
  if (isPage) fileType = "page";
  else if (isLayout) fileType = "layout";

  const routePath = filePathToPagePath(filePath);

  return { filePath, fileType, componentType, routePath };
}

/**
 * Extract Server Action functions from a file with "use server" directive.
 */
export function extractServerActions(sourceFile: SourceFile): string[] {
  const fullText = sourceFile.getFullText();

  // File-level "use server"
  const isFileLevel = /^["']use server["'];?/m.test(fullText);
  const actions: string[] = [];

  if (isFileLevel) {
    // All exported functions are server actions
    for (const funcDecl of sourceFile.getFunctions()) {
      if (funcDecl.isExported()) {
        const name = funcDecl.getName();
        if (name) actions.push(name);
      }
    }
    return actions;
  }

  // Inline "use server" inside function bodies
  for (const funcDecl of sourceFile.getFunctions()) {
    if (!funcDecl.isExported()) continue;
    const body = funcDecl.getBody();
    if (!body) continue;
    const bodyText = body.getText();
    if (/["']use server["'];?/.test(bodyText)) {
      const name = funcDecl.getName();
      if (name) actions.push(name);
    }
  }

  return actions;
}

/** Metadata for a Next.js component file. */
export interface NextjsComponentInfo {
  filePath: string;
  fileType: "page" | "layout" | "route";
  componentType: "server" | "client" | "server-action";
  routePath: string;
}

// --- Internal helpers ---

function isRouteFile(filePath: string): boolean {
  return /\/route\.(ts|tsx|js|jsx)$/.test(filePath);
}

function isPageFile(filePath: string): boolean {
  return /\/page\.(ts|tsx|js|jsx)$/.test(filePath);
}

function isLayoutFile(filePath: string): boolean {
  return /\/layout\.(ts|tsx|js|jsx)$/.test(filePath);
}

/**
 * Convert a Next.js App Router file path to an API route path.
 * e.g. "src/app/api/users/[id]/route.ts" → "/api/users/:id"
 */
function filePathToRoutePath(filePath: string): string {
  // Extract the app directory segment and everything after
  const appMatch = filePath.match(/\/app\/(.+)\/route\.(ts|tsx|js|jsx)$/);
  if (!appMatch) return "/";

  const segments = appMatch[1];
  return "/" + convertDynamicSegments(segments);
}

/**
 * Convert a Next.js page/layout file path to a page route path.
 * e.g. "src/app/admin/users/page.tsx" → "/admin/users"
 */
function filePathToPagePath(filePath: string): string {
  const appMatch = filePath.match(/\/app\/(.+)\/(page|layout)\.(ts|tsx|js|jsx)$/);
  if (!appMatch) return "/";

  const segments = appMatch[1];
  return "/" + convertDynamicSegments(segments);
}

/**
 * Convert Next.js dynamic route segments to Express-style params.
 * [id] → :id, [...slug] → :slug*, [[...slug]] → :slug*?
 */
function convertDynamicSegments(segments: string): string {
  return segments
    .replace(/\[\[\.\.\.(\w+)\]\]/g, ":$1*?")  // optional catch-all
    .replace(/\[\.\.\.(\w+)\]/g, ":$1*")         // catch-all
    .replace(/\[(\w+)\]/g, ":$1");                // dynamic segment
}

/**
 * Extract JSDoc description and tags from the HTTP method function.
 */
function extractNextjsRouteJSDoc(
  sourceFile: SourceFile,
  funcName: string,
): { description: string | undefined; tags: RouteJSDocTag[] } {
  const empty = { description: undefined, tags: [] };
  const funcDecl = sourceFile.getFunction(funcName);
  if (!funcDecl) return empty;

  const jsDocs = funcDecl.getJsDocs();
  if (jsDocs.length === 0) return empty;

  const jsDoc = jsDocs[jsDocs.length - 1];
  const descLines: string[] = [];
  const tags: RouteJSDocTag[] = [];

  // Request/response params to exclude
  const nextjsParams = new Set(["request", "req", "context", "params"]);

  const description = jsDoc.getDescription().trim();
  const httpPattern = /^(GET|POST|PUT|DELETE|PATCH)\s+\//i;

  for (const line of description.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (descLines.length === 0 && httpPattern.test(trimmed)) continue;
    descLines.push(trimmed);
  }

  for (const tag of jsDoc.getTags()) {
    const tagName = tag.getTagName();
    const tagText = tag.getText()
      .replace(/^\s*@\w+\s*/, "")
      .trim();

    if (tagName === "param") {
      const paramMatch = tagText.match(/^(\w+)\s*[-—–]?\s*(.*)/);
      if (paramMatch && !nextjsParams.has(paramMatch[1])) {
        tags.push({ tag: "param", name: paramMatch[1], description: paramMatch[2] || "" });
      }
    } else if (tagName === "returns" || tagName === "return") {
      tags.push({ tag: "returns", description: tagText.replace(/^[-—–]\s*/, "") });
    } else if (tagName === "throws" || tagName === "throw") {
      tags.push({ tag: "throws", description: tagText.replace(/^[-—–]\s*/, "") });
    }
  }

  return {
    description: descLines.length > 0 ? descLines.join("\n") : undefined,
    tags,
  };
}

/**
 * Extract method calls to use cases / services from a Next.js route handler body.
 * Detects patterns like:
 * - `new CreateOrderUseCase(repo)` → constructor call
 * - `useCase.execute(...)` → method call on new-ed instance
 */
function extractHandlerCalls(
  sourceFile: SourceFile,
  funcName: string,
): RouteCallInfo[] {
  const funcDecl = sourceFile.getFunction(funcName);
  if (!funcDecl) return [];

  // Build variable → type map from `new Type(...)` patterns
  const varTypeMap = new Map<string, string>();
  for (const varDecl of funcDecl.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    const init = varDecl.getInitializer();
    if (!init || init.getKind() !== SyntaxKind.NewExpression) continue;
    const newExpr = init.asKind(SyntaxKind.NewExpression);
    if (!newExpr) continue;
    const typeName = newExpr.getExpression().getText();
    varTypeMap.set(varDecl.getName(), typeName);
  }

  // Extract method calls on typed variables
  const calls: RouteCallInfo[] = [];
  const seen = new Set<string>();

  for (const callExpr of funcDecl.getDescendantsOfKind(SyntaxKind.CallExpression)) {
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
