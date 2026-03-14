export interface PropertyInfo {
  name: string;
  type: string;
  description: string;
  isReadonly: boolean;
  isOptional: boolean;
  visibility: "public" | "protected" | "private";
}

export interface ParameterInfo {
  name: string;
  type: string;
  description: string;
  isOptional: boolean;
  defaultValue?: string;
}

export interface ThrowInfo {
  type: string;
  description: string;
}

export interface CallerReference {
  callerName: string;
  filePath: string;
  layerName?: string;
  callType?: "direct" | "interface";
  interfaceName?: string;
}

export interface MethodInfo {
  name: string;
  description: string;
  signature: string;
  parameters: ParameterInfo[];
  returnType: string;
  returnDescription: string;
  throws: ThrowInfo[];
  businessRules: string[];
  visibility: "public" | "protected" | "private";
  calledBy?: CallerReference[];
}

export interface MethodSignatureInfo {
  name: string;
  description: string;
  signature: string;
  parameters: ParameterInfo[];
  returnType: string;
  returnDescription: string;
}

export interface DependencyInfo {
  source: string;
  target: string;
  type: "import" | "see";
  sourceFile?: string;
  importPath?: string;
  isForbidden?: boolean;
}

export interface ClassInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  subDirectory: string;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  businessRules: string[];
  dependencies: DependencyInfo[];
  isExported: boolean;
  extendsClass?: string;
  implementsInterfaces: string[];
}

export interface InterfaceInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  subDirectory: string;
  properties: PropertyInfo[];
  methods: MethodSignatureInfo[];
  isExported: boolean;
  extendsInterfaces: string[];
}

export interface RouteCallInfo {
  target: string;
  method: string;
}

export interface RouteJSDocTag {
  tag: string;       // "param", "returns", "throws"
  name?: string;     // parameter name (for @param)
  description: string;
}

export interface RouteInfo {
  method: string;
  path: string;
  middlewares: string[];
  description?: string;
  jsdocTags?: RouteJSDocTag[];
  calls: RouteCallInfo[];
}

export interface FunctionInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  subDirectory: string;
  signature: string;
  parameters: ParameterInfo[];
  returnType: string;
  returnDescription: string;
  throws: ThrowInfo[];
  businessRules: string[];
  isExported: boolean;
  calledBy?: CallerReference[];
  routes?: RouteInfo[];
}

export interface CallChainEntry {
  className: string;
  filePath: string;
  constructorDeps: { paramName: string; typeName: string }[];
  methods: {
    methodName: string;
    calls: { target: string; method: string }[];
  }[];
}

export interface LayerExtraction {
  layerName: string;
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  functions: FunctionInfo[];
  dependencies: DependencyInfo[];
  callChains: CallChainEntry[];
}
