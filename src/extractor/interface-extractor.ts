import type { InterfaceDeclaration } from "ts-morph";
import type {
  InterfaceInfo,
  PropertyInfo,
  MethodSignatureInfo,
  ParameterInfo,
} from "../types/extracted.js";
import { parseJsDoc, mergeParamDescriptions } from "./jsdoc-parser.js";

export function extractInterface(
  ifaceDecl: InterfaceDeclaration,
  category: string,
): InterfaceInfo {
  const jsdoc = parseJsDoc(ifaceDecl);

  const extendsInterfaces = ifaceDecl
    .getExtends()
    .map((ext) => ext.getExpression().getText());

  return {
    name: ifaceDecl.getName(),
    filePath: ifaceDecl.getSourceFile().getFilePath(),
    description: jsdoc.description,
    category,
    properties: ifaceDecl.getProperties().map(extractProperty),
    methods: ifaceDecl.getMethods().map(extractMethodSignature),
    isExported: ifaceDecl.isExported(),
    extendsInterfaces,
  };
}

function extractProperty(
  prop: import("ts-morph").PropertySignature,
): PropertyInfo {
  const jsdoc = parseJsDoc(prop);
  return {
    name: prop.getName(),
    type: prop.getType().getText(prop),
    description: jsdoc.description,
    isReadonly: prop.isReadonly(),
    isOptional: prop.hasQuestionToken(),
    visibility: "public",
  };
}

function extractMethodSignature(
  method: import("ts-morph").MethodSignature,
): MethodSignatureInfo {
  const jsdoc = parseJsDoc(method);

  const params: ParameterInfo[] = method.getParameters().map((p) => ({
    name: p.getName(),
    type: p.getType().getText(p),
    description: "",
    isOptional: p.isOptional(),
    defaultValue: p.getInitializer()?.getText(),
  }));

  const mergedParams = mergeParamDescriptions(params, jsdoc.params);
  const name = method.getName();
  const paramSigs = method.getParameters().map((p) => {
    const opt = p.isOptional() ? "?" : "";
    return `${p.getName()}${opt}: ${p.getType().getText(p)}`;
  });
  const returnType = method.getReturnType().getText(method);
  const signature = `${name}(${paramSigs.join(", ")}): ${returnType}`;

  return {
    name,
    description: jsdoc.description,
    signature,
    parameters: mergedParams,
    returnType,
    returnDescription: jsdoc.returns,
  };
}
