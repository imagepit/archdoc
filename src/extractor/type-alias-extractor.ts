import type { TypeAliasDeclaration } from "ts-morph";
import type { TypeAliasInfo, PropertyInfo } from "../types/extracted.js";
import { parseJsDoc } from "./jsdoc-parser.js";

/**
 * TypeScript型エイリアス宣言からメタデータを抽出する。
 * @param decl - 型エイリアス宣言ノード
 * @param category - 所属カテゴリ名
 * @returns 抽出された型エイリアス情報
 */
export function extractTypeAlias(
  decl: TypeAliasDeclaration,
  category: string,
): TypeAliasInfo {
  const jsdoc = parseJsDoc(decl);
  const type = decl.getType();
  const typeText = type.getText(decl);

  const properties: PropertyInfo[] = [];
  if (type.isObject() && !type.isArray()) {
    for (const prop of type.getProperties()) {
      const propDecl = prop.getValueDeclaration();
      const propType = propDecl
        ? prop.getTypeAtLocation(propDecl).getText(propDecl)
        : "unknown";
      const isOptional = propDecl
        ? (propDecl as { hasQuestionToken?: () => boolean }).hasQuestionToken?.() ?? false
        : false;

      properties.push({
        name: prop.getName(),
        type: propType,
        description: "",
        isReadonly: false,
        isOptional,
        visibility: "public",
      });
    }
  }

  return {
    name: decl.getName(),
    filePath: decl.getSourceFile().getFilePath(),
    description: jsdoc.description,
    category,
    subDirectory: "",
    typeText,
    properties,
    isExported: decl.isExported(),
  };
}
