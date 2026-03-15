/** クラスまたはインターフェースから抽出されたプロパティ情報。 */
export interface PropertyInfo {
  name: string;
  type: string;
  description: string;
  isReadonly: boolean;
  isOptional: boolean;
  visibility: "public" | "protected" | "private";
}

/** 関数またはメソッドから抽出された引数情報。 */
export interface ParameterInfo {
  name: string;
  type: string;
  description: string;
  isOptional: boolean;
  defaultValue?: string;
}

/** JSDoc @throwsタグから抽出されたエラー情報。 */
export interface ThrowInfo {
  type: string;
  description: string;
}

/** このメソッドまたは関数を呼び出しているコンポーネントの参照情報。 */
export interface CallerReference {
  callerName: string;
  filePath: string;
  layerName?: string;
  callType?: "direct" | "interface";
  interfaceName?: string;
}

/** シグネチャ・引数・ビジネスルールを含むメソッド情報。 */
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

/** インターフェース宣言から抽出されたメソッドシグネチャ。 */
export interface MethodSignatureInfo {
  name: string;
  description: string;
  signature: string;
  parameters: ParameterInfo[];
  returnType: string;
  returnDescription: string;
}

/** レイヤー間のインポート依存関係（禁止インポート検出含む）。 */
export interface DependencyInfo {
  source: string;
  target: string;
  type: "import" | "see";
  sourceFile?: string;
  importPath?: string;
  isForbidden?: boolean;
}

/** プロパティ・メソッド・依存関係を含むクラス情報。 */
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

/** プロパティ・メソッドシグネチャを含むインターフェース情報。 */
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

/** Expressルートハンドラ内のメソッド呼び出し。 */
export interface RouteCallInfo {
  target: string;
  method: string;
}

/** Expressルートハンドラから抽出されたJSDocタグ。 */
export interface RouteJSDocTag {
  tag: string;       // "param", "returns", "throws"
  name?: string;     // parameter name (for @param)
  description: string;
}

/** ミドルウェアとコールチェーンを含むExpressルート定義。 */
export interface RouteInfo {
  method: string;
  path: string;
  middlewares: string[];
  description?: string;
  jsdocTags?: RouteJSDocTag[];
  calls: RouteCallInfo[];
}

/** シグネチャ・引数・ルート情報を含む関数情報。 */
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

/** 型エイリアスの抽出情報。 */
export interface TypeAliasInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  subDirectory: string;
  typeText: string;
  properties: PropertyInfo[];
  isExported: boolean;
}

/** enum宣言の個別メンバー情報。 */
export interface EnumMemberInfo {
  name: string;
  value: string;
  description: string;
}

/** enum宣言の抽出情報。 */
export interface EnumInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  subDirectory: string;
  members: EnumMemberInfo[];
  isExported: boolean;
}

/** エクスポートされた定数の抽出情報。 */
export interface ConstInfo {
  name: string;
  filePath: string;
  description: string;
  category: string;
  subDirectory: string;
  type: string;
  valuePreview: string;
  isExported: boolean;
}

/** コールチェーン解析用のコンストラクタ依存パラメータ。 */
export interface ConstructorDep {
  paramName: string;
  typeName: string;
}

/** クラスメソッドまたは関数内での依存先への単一メソッド呼び出し。 */
export interface MethodCall {
  target: string;
  method: string;
}

/** 単一メソッド内のすべての依存先呼び出し。 */
export interface MethodCallChain {
  methodName: string;
  calls: MethodCall[];
}

/** クラスまたは関数の完全なコールチェーン（依存先とメソッド呼び出しを含む）。 */
export interface ClassCallChain {
  className: string;
  filePath: string;
  constructorDeps: ConstructorDep[];
  methods: MethodCallChain[];
}

/** LayerExtractionに格納されるシリアライズ可能なコールチェーンエントリ。 */
export interface CallChainEntry {
  className: string;
  filePath: string;
  constructorDeps: { paramName: string; typeName: string }[];
  methods: {
    methodName: string;
    calls: { target: string; method: string }[];
  }[];
}

/** 単一アーキテクチャレイヤーの完全な抽出結果。 */
export interface LayerExtraction {
  layerName: string;
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  functions: FunctionInfo[];
  typeAliases: TypeAliasInfo[];
  enums: EnumInfo[];
  constants: ConstInfo[];
  dependencies: DependencyInfo[];
  callChains: CallChainEntry[];
}
