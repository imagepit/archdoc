import type { VariableDeclaration } from "ts-morph";
import type { ConstInfo } from "../types/extracted.js";
import { parseJsDoc } from "./jsdoc-parser.js";

const MAX_VALUE_PREVIEW = 80;

export function extractConst(
  decl: VariableDeclaration,
  category: string,
): ConstInfo {
  const statement = decl.getVariableStatement();
  const jsdoc = statement ? parseJsDoc(statement) : { description: "" };

  const initializer = decl.getInitializer();
  let valuePreview = initializer?.getText() ?? "";
  if (valuePreview.length > MAX_VALUE_PREVIEW) {
    valuePreview = valuePreview.slice(0, MAX_VALUE_PREVIEW - 1) + "…";
  }

  return {
    name: decl.getName(),
    filePath: decl.getSourceFile().getFilePath(),
    description: jsdoc.description,
    category,
    subDirectory: "",
    type: decl.getType().getText(decl),
    valuePreview,
    isExported: statement?.isExported() ?? false,
  };
}
