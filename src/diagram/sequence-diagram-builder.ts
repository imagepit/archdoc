import type { ClassCallChain } from "../types/extracted.js";

/**
 * 単一コールチェーンエントリからMermaidシーケンス図を生成する。
 * @param chain - コールチェーンエントリ
 * @returns Mermaidシーケンス図文字列
 */
export function buildSequenceDiagram(chain: ClassCallChain): string {
  if (chain.methods.length === 0) return "";

  const lines: string[] = ["sequenceDiagram"];

  // Add participants
  lines.push(`  participant Client`);
  lines.push(`  participant ${chain.className}`);

  const addedParticipants = new Set<string>();
  for (const dep of chain.constructorDeps) {
    if (!addedParticipants.has(dep.typeName)) {
      addedParticipants.add(dep.typeName);
      lines.push(`  participant ${dep.typeName}`);
    }
  }

  const depNameToType = new Map<string, string>();
  for (const dep of chain.constructorDeps) {
    depNameToType.set(dep.paramName, dep.typeName);
  }

  // Add interactions for each method
  for (const method of chain.methods) {
    lines.push(`  Client->>+${chain.className}: ${method.methodName}()`);

    for (const call of method.calls) {
      const targetType = depNameToType.get(call.target);
      if (targetType && addedParticipants.has(targetType)) {
        lines.push(
          `  ${chain.className}->>+${targetType}: ${call.method}()`,
        );
        lines.push(
          `  ${targetType}-->>-${chain.className}: result`,
        );
      }
    }

    lines.push(`  ${chain.className}-->>-Client: response`);
  }

  return lines.join("\n");
}

/**
 * 複数コールチェーンからクラス名をキーとするシーケンス図を生成する。
 * @param chains - コールチェーン配列
 * @returns クラス名をキーとするシーケンス図のMap
 */
export function buildMultiSequenceDiagrams(
  chains: ClassCallChain[],
): Map<string, string> {
  const diagrams = new Map<string, string>();

  for (const chain of chains) {
    const diagram = buildSequenceDiagram(chain);
    if (diagram) {
      diagrams.set(chain.className, diagram);
    }
  }

  return diagrams;
}
