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
}

export interface ClassInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  businessRules: string[];
  dependencies: DependencyInfo[];
  isExported: boolean;
}

export interface InterfaceInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  properties: PropertyInfo[];
  methods: MethodSignatureInfo[];
  isExported: boolean;
}

export interface FunctionInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  signature: string;
  parameters: ParameterInfo[];
  returnType: string;
  returnDescription: string;
  throws: ThrowInfo[];
  businessRules: string[];
  isExported: boolean;
}

export interface LayerExtraction {
  layerName: string;
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  functions: FunctionInfo[];
  dependencies: DependencyInfo[];
}
