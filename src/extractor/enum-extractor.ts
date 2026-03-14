import type { EnumDeclaration } from "ts-morph";
import type { EnumInfo, EnumMemberInfo } from "../types/extracted.js";
import { parseJsDoc } from "./jsdoc-parser.js";

export function extractEnum(
  decl: EnumDeclaration,
  category: string,
): EnumInfo {
  const jsdoc = parseJsDoc(decl);

  const members: EnumMemberInfo[] = decl.getMembers().map((member) => {
    const memberJsdoc = parseJsDoc(member);
    return {
      name: member.getName(),
      value: member.getValue()?.toString() ?? member.getInitializer()?.getText() ?? "",
      description: memberJsdoc.description,
    };
  });

  return {
    name: decl.getName(),
    filePath: decl.getSourceFile().getFilePath(),
    description: jsdoc.description,
    category,
    subDirectory: "",
    members,
    isExported: decl.isExported(),
  };
}
