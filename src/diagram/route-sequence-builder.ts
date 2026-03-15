import type { RouteInfo } from "../types/extracted.js";

/**
 * 単一ルートハンドラーのコールチェーンからMermaidシーケンス図を生成する。
 * MermaidRendererとSvgRenderer（フォールバック）で共有される。
 * @param funcName - ルートハンドラー関数名
 * @param route - ルート情報
 * @returns Mermaidシーケンス図文字列、またはnull
 */
export function buildRouteSequenceDiagram(funcName: string, route: RouteInfo): string | null {
  if (route.calls.length === 0) return null;

  const lines: string[] = ["sequenceDiagram"];
  lines.push(`    participant Client`);
  lines.push(`    participant ${funcName}`);

  const participants = new Set<string>();
  for (const call of route.calls) {
    if (!participants.has(call.target)) {
      participants.add(call.target);
      lines.push(`    participant ${call.target}`);
    }
  }

  // Request flow
  lines.push(`    Client->>${funcName}: ${route.method} ${route.path}`);

  for (const call of route.calls) {
    lines.push(`    ${funcName}->>${call.target}: ${call.method}()`);
    lines.push(`    ${call.target}-->>${funcName}: `);
  }

  // Response: use @returns description or default
  const returnsTag = route.jsdocTags?.find((t) => t.tag === "returns");
  const returnsDesc = returnsTag?.description || "レスポンス";
  lines.push(`    ${funcName}-->>Client: ${returnsDesc}`);

  return lines.join("\n");
}
