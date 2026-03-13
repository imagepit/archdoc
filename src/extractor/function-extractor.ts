import type { FunctionDeclaration } from "ts-morph";
import type { FunctionInfo, ParameterInfo } from "../types/extracted.js";
import { parseJsDoc, mergeParamDescriptions } from "./jsdoc-parser.js";

export function extractFunction(
  funcDecl: FunctionDeclaration,
  category: string,
): FunctionInfo {
  const jsdoc = parseJsDoc(funcDecl);
  const name = funcDecl.getName() ?? "anonymous";

  const params: ParameterInfo[] = funcDecl.getParameters().map((p) => ({
    name: p.getName(),
    type: p.getType().getText(p),
    description: "",
    isOptional: p.isOptional(),
    defaultValue: p.getInitializer()?.getText(),
  }));

  const mergedParams = mergeParamDescriptions(params, jsdoc.params);
  const paramSigs = funcDecl.getParameters().map((p) => {
    const opt = p.isOptional() ? "?" : "";
    return `${p.getName()}${opt}: ${p.getType().getText(p)}`;
  });
  const returnType = funcDecl.getReturnType().getText(funcDecl);
  const signature = `${name}(${paramSigs.join(", ")}): ${returnType}`;

  return {
    name,
    filePath: funcDecl.getSourceFile().getFilePath(),
    description: jsdoc.description,
    category,
    subDirectory: "",
    signature,
    parameters: mergedParams,
    returnType,
    returnDescription: jsdoc.returns,
    throws: jsdoc.throws,
    businessRules: jsdoc.businessRules,
    isExported: funcDecl.isExported(),
  };
}
