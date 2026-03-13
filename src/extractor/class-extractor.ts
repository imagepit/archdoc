import { type ClassDeclaration, Scope } from "ts-morph";
import type { ClassInfo, PropertyInfo, MethodInfo, ParameterInfo } from "../types/extracted.js";
import { parseJsDoc, mergeParamDescriptions } from "./jsdoc-parser.js";

export function extractClass(classDecl: ClassDeclaration, category: string): ClassInfo {
  const jsdoc = parseJsDoc(classDecl);

  const extendsExpr = classDecl.getExtends();
  const extendsClass = extendsExpr
    ? extendsExpr.getExpression().getText()
    : undefined;

  const implementsInterfaces = classDecl
    .getImplements()
    .map((impl) => impl.getExpression().getText());

  return {
    name: classDecl.getName() ?? "Anonymous",
    filePath: classDecl.getSourceFile().getFilePath(),
    description: jsdoc.description,
    category,
    subDirectory: "",
    properties: classDecl
      .getProperties()
      .filter((p) => p.getScope() !== Scope.Private)
      .map(extractProperty),
    methods: classDecl
      .getMethods()
      .filter((m) => m.getScope() !== Scope.Private)
      .map(extractMethod),
    businessRules: jsdoc.businessRules,
    dependencies: jsdoc.see,
    isExported: classDecl.isExported(),
    extendsClass,
    implementsInterfaces,
  };
}

function extractProperty(prop: import("ts-morph").PropertyDeclaration): PropertyInfo {
  const jsdoc = parseJsDoc(prop);
  return {
    name: prop.getName(),
    type: prop.getType().getText(prop),
    description: jsdoc.description,
    isReadonly: prop.isReadonly(),
    isOptional: prop.hasQuestionToken(),
    visibility: scopeToVisibility(prop.getScope()),
  };
}

function extractMethod(method: import("ts-morph").MethodDeclaration): MethodInfo {
  const jsdoc = parseJsDoc(method);

  const params: ParameterInfo[] = method.getParameters().map((p) => ({
    name: p.getName(),
    type: p.getType().getText(p),
    description: "",
    isOptional: p.isOptional(),
    defaultValue: p.getInitializer()?.getText(),
  }));

  const mergedParams = mergeParamDescriptions(params, jsdoc.params);
  const signature = buildMethodSignature(method);

  return {
    name: method.getName(),
    description: jsdoc.description,
    signature,
    parameters: mergedParams,
    returnType: method.getReturnType().getText(method),
    returnDescription: jsdoc.returns,
    throws: jsdoc.throws,
    businessRules: jsdoc.businessRules,
    visibility: scopeToVisibility(method.getScope()),
  };
}

function buildMethodSignature(method: import("ts-morph").MethodDeclaration): string {
  const name = method.getName();
  const params = method.getParameters().map((p) => {
    const opt = p.isOptional() ? "?" : "";
    return `${p.getName()}${opt}: ${p.getType().getText(p)}`;
  });
  const returnType = method.getReturnType().getText(method);
  return `${name}(${params.join(", ")}): ${returnType}`;
}

function scopeToVisibility(
  scope: Scope | undefined,
): "public" | "protected" | "private" {
  switch (scope) {
    case Scope.Protected:
      return "protected";
    case Scope.Private:
      return "private";
    default:
      return "public";
  }
}
