import type { JSDocableNode } from "ts-morph";
import type { ParameterInfo, ThrowInfo, DependencyInfo } from "../types/extracted.js";

export interface ParsedJsDoc {
  description: string;
  params: Map<string, string>;
  returns: string;
  throws: ThrowInfo[];
  businessRules: string[];
  see: DependencyInfo[];
}

export function parseJsDoc(node: JSDocableNode): ParsedJsDoc {
  const result: ParsedJsDoc = {
    description: "",
    params: new Map(),
    returns: "",
    throws: [],
    businessRules: [],
    see: [],
  };

  const jsDocs = node.getJsDocs();
  if (jsDocs.length === 0) return result;

  const jsDoc = jsDocs[0];
  result.description = jsDoc.getComment()?.toString().trim() ?? "";

  for (const tag of jsDoc.getTags()) {
    const tagName = tag.getTagName();
    const tagText = tag.getCommentText()?.trim() ?? "";

    switch (tagName) {
      case "param": {
        const paramTag = tag;
        const name = (paramTag as unknown as { getName?: () => string }).getName?.() ?? "";
        if (name) {
          result.params.set(name, cleanDescription(tagText));
        } else {
          const match = tagText.match(/^(\w+)\s*[-–—]?\s*(.*)/s);
          if (match) {
            result.params.set(match[1], match[2]);
          }
        }
        break;
      }
      case "returns":
      case "return":
        result.returns = tagText;
        break;
      case "throws":
      case "throw": {
        // ts-morph getCommentText() may or may not include {Type}
        // Try full tag text first, then fall back to comment text
        const fullText = tag.getText().replace(/^@throws?\s*/, "").trim();
        const throwMatch = fullText.match(/^\{([^}]+)\}\s*[-–—]?\s*(.*)/s);
        if (throwMatch) {
          result.throws.push({ type: throwMatch[1], description: cleanDescription(throwMatch[2]) });
        } else {
          // No {Type} wrapper — use tagText as description
          result.throws.push({ type: "", description: cleanDescription(tagText || fullText) });
        }
        break;
      }
      case "businessRule":
        result.businessRules.push(tagText);
        break;
      case "see": {
        result.see.push({ source: "", target: tagText, type: "see" });
        break;
      }
    }
  }

  return result;
}

function cleanDescription(text: string): string {
  return text
    .replace(/^\s*[-–—]\s*/, "")  // Remove leading dash separator
    .replace(/\n\s*\*\s*$/s, "")   // Remove trailing JSDoc asterisks
    .trim();
}

export function mergeParamDescriptions(
  params: ParameterInfo[],
  jsDocParams: Map<string, string>,
): ParameterInfo[] {
  return params.map((p) => ({
    ...p,
    description: jsDocParams.get(p.name) ?? p.description,
  }));
}
