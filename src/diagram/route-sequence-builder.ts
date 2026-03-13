import type { RouteInfo } from "../types/extracted.js";

/**
 * Build a Mermaid sequence diagram for a single route handler call chain.
 * Shared between MermaidRenderer and SvgRenderer (fallback).
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

  lines.push(`    Client->>${funcName}: ${route.method} ${route.path}`);

  for (const call of route.calls) {
    lines.push(`    ${funcName}->>${call.target}: ${call.method}()`);
  }

  return lines.join("\n");
}
