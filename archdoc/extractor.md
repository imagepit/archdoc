---
title: Extractor — 抽出層 API Spec
description: ソースコードの静的解析と情報抽出
---

# Extractor — 抽出層 API Spec

## Responsibilities & Constraints

| Item | Detail |
| --- | --- |
| **Path** | `src/extractor/` |
| **Responsibility** | ソースコードの静的解析と情報抽出 |
| **Forbidden Imports** | `src/cli`, `src/diagram`, `src/generator` |

TypeScriptソースコードからAST解析でクラス・インターフェース・
関数・型・enum・定数を抽出する。

![Extractor Class Diagram](diagrams/extractor-class.svg)

## Framework Extractor

![Class Diagram](diagrams/detail-2.svg)

### 🏗️ `ExpressExtractor`

> **File**: `express-extractor.ts`
> **Type**: Framework Extractor

**Methods**

#### `extractRoutes(sourceFile: SourceFile, funcName: string): RouteInfo[]`

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceFile` | `SourceFile` | — |
| `funcName` | `string` | — |

**Returns**: `RouteInfo[]` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`) via `FrameworkExtractor`

#### `resolveMountPrefixes(layerSourceFiles: SourceFile[], allSourceFiles: SourceFile[], functions: FunctionInfo[]): void`

| Parameter | Type | Description |
| --- | --- | --- |
| `layerSourceFiles` | `SourceFile[]` | — |
| `allSourceFiles` | `SourceFile[]` | — |
| `functions` | `FunctionInfo[]` | — |

**Called By**

- `extractLayer()` — Extractor (`project.ts`) via `FrameworkExtractor`

### 📋 `FrameworkExtractor`

> **File**: `framework-extractor.ts`
> **Type**: Framework Extractor

**Methods**

#### `extractRoutes(sourceFile: SourceFile, funcName: string): RouteInfo[]`

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceFile` | `SourceFile` | — |
| `funcName` | `string` | — |

**Returns**: `RouteInfo[]` 

#### `resolveMountPrefixes(layerSourceFiles: SourceFile[], allSourceFiles: SourceFile[], functions: FunctionInfo[]): void`

Post-processing step: resolve app.use() / router.use() mount patterns
and prepend prefixes to sub-router routes.

| Parameter | Type | Description |
| --- | --- | --- |
| `layerSourceFiles` | `SourceFile[]` | Source files within the layer being extracted |
| `allSourceFiles` | `SourceFile[]` | All source files in the project (to detect app.use() in app.ts etc.) |
| `functions` | `FunctionInfo[]` | Extracted functions whose routes will be updated |

### 🔧 `createFrameworkExtractor`

> **File**: `index.ts`

```ts
createFrameworkExtractor(framework?: string | undefined): FrameworkExtractor | null
```

| Parameter | Type | Description |
| --- | --- | --- |
| `framework` | `string or undefined` | — |

**Returns**: `FrameworkExtractor | null` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

## Other

![Class Diagram](diagrams/detail-3.svg)

### 📋 `ConstructorDep`

> **File**: `call-chain-analyzer.ts`
> **Type**: Other

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `paramName` | `string` | ✓ | — |
| `typeName` | `string` | ✓ | — |

### 📋 `MethodCall`

> **File**: `call-chain-analyzer.ts`
> **Type**: Other

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | `string` | ✓ | — |
| `method` | `string` | ✓ | — |

### 📋 `MethodCallChain`

> **File**: `call-chain-analyzer.ts`
> **Type**: Other

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `methodName` | `string` | ✓ | — |
| `calls` | `MethodCall[]` | ✓ | — |

### 📋 `ClassCallChain`

> **File**: `call-chain-analyzer.ts`
> **Type**: Other

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `className` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `constructorDeps` | `ConstructorDep[]` | ✓ | — |
| `methods` | `MethodCallChain[]` | ✓ | — |

### 📋 `ParsedJsDoc`

> **File**: `jsdoc-parser.ts`
> **Type**: Other

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `description` | `string` | ✓ | — |
| `params` | `Map<string, string>` | ✓ | — |
| `returns` | `string` | ✓ | — |
| `throws` | `ThrowInfo[]` | ✓ | — |
| `businessRules` | `string[]` | ✓ | — |
| `see` | `DependencyInfo[]` | ✓ | — |

### 🔧 `analyzeCallChains`

> **File**: `call-chain-analyzer.ts`

```ts
analyzeCallChains(sourceFiles: SourceFile[]): ClassCallChain[]
```

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceFiles` | `SourceFile[]` | — |

**Returns**: `ClassCallChain[]` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `analyzeCallerReferences`

> **File**: `caller-analyzer.ts`

Post-process: analyze caller references for all methods and functions.
Must be called AFTER all layers have been extracted (all source files loaded).
Mutates MethodInfo.calledBy and FunctionInfo.calledBy in-place.

```ts
analyzeCallerReferences(project: Project, extractions: LayerExtraction[], layers?: LayerConfig[] | undefined): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `project` | `Project` | — |
| `extractions` | `LayerExtraction[]` | — |
| `layers` | `LayerConfig[] or undefined` | — |

**Called By**

- `registerGenerateCommand()` — Cli (`generate.ts`)

### 🔧 `extractClass`

> **File**: `class-extractor.ts`

```ts
extractClass(classDecl: ClassDeclaration, category: string): ClassInfo
```

| Parameter | Type | Description |
| --- | --- | --- |
| `classDecl` | `ClassDeclaration` | — |
| `category` | `string` | — |

**Returns**: `ClassInfo` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `extractConst`

> **File**: `const-extractor.ts`

```ts
extractConst(decl: VariableDeclaration, category: string): ConstInfo
```

| Parameter | Type | Description |
| --- | --- | --- |
| `decl` | `VariableDeclaration` | — |
| `category` | `string` | — |

**Returns**: `ConstInfo` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `extractEnum`

> **File**: `enum-extractor.ts`

```ts
extractEnum(decl: EnumDeclaration, category: string): EnumInfo
```

| Parameter | Type | Description |
| --- | --- | --- |
| `decl` | `EnumDeclaration` | — |
| `category` | `string` | — |

**Returns**: `EnumInfo` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `extractFunction`

> **File**: `function-extractor.ts`

```ts
extractFunction(funcDecl: FunctionDeclaration, category: string): FunctionInfo
```

| Parameter | Type | Description |
| --- | --- | --- |
| `funcDecl` | `FunctionDeclaration` | — |
| `category` | `string` | — |

**Returns**: `FunctionInfo` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `analyzeImports`

> **File**: `import-analyzer.ts`

```ts
analyzeImports(sourceFile: SourceFile, layers: LayerConfig[]): DependencyInfo[]
```

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceFile` | `SourceFile` | — |
| `layers` | `LayerConfig[]` | — |

**Returns**: `DependencyInfo[]` 

**Called By**

- `findForbiddenImports()` — Extractor (`import-analyzer.ts`)
- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `findForbiddenImports`

> **File**: `import-analyzer.ts`

```ts
findForbiddenImports(sourceFile: SourceFile, currentLayer: LayerConfig, layers: LayerConfig[]): DependencyInfo[]
```

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceFile` | `SourceFile` | — |
| `currentLayer` | `LayerConfig` | — |
| `layers` | `LayerConfig[]` | — |

**Returns**: `DependencyInfo[]` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `extractInterface`

> **File**: `interface-extractor.ts`

```ts
extractInterface(ifaceDecl: InterfaceDeclaration, category: string): InterfaceInfo
```

| Parameter | Type | Description |
| --- | --- | --- |
| `ifaceDecl` | `InterfaceDeclaration` | — |
| `category` | `string` | — |

**Returns**: `InterfaceInfo` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)

### 🔧 `parseJsDoc`

> **File**: `jsdoc-parser.ts`

```ts
parseJsDoc(node: JSDocableNode): ParsedJsDoc
```

| Parameter | Type | Description |
| --- | --- | --- |
| `node` | `JSDocableNode` | — |

**Returns**: `ParsedJsDoc` 

**Called By**

- `extractClass()` — Extractor (`class-extractor.ts`)
- `extractProperty()` — Extractor (`class-extractor.ts`)
- `extractMethod()` — Extractor (`class-extractor.ts`)
- `extractConst()` — Extractor (`const-extractor.ts`)
- `extractEnum()` — Extractor (`enum-extractor.ts`)
- `extractFunction()` — Extractor (`function-extractor.ts`)
- `extractInterface()` — Extractor (`interface-extractor.ts`)
- `extractProperty()` — Extractor (`interface-extractor.ts`)
- `extractMethodSignature()` — Extractor (`interface-extractor.ts`)
- `extractTypeAlias()` — Extractor (`type-alias-extractor.ts`)

### 🔧 `mergeParamDescriptions`

> **File**: `jsdoc-parser.ts`

```ts
mergeParamDescriptions(params: ParameterInfo[], jsDocParams: Map<string, string>): ParameterInfo[]
```

| Parameter | Type | Description |
| --- | --- | --- |
| `params` | `ParameterInfo[]` | — |
| `jsDocParams` | `Map<string, string>` | — |

**Returns**: `ParameterInfo[]` 

**Called By**

- `extractMethod()` — Extractor (`class-extractor.ts`)
- `extractFunction()` — Extractor (`function-extractor.ts`)
- `extractMethodSignature()` — Extractor (`interface-extractor.ts`)

### 🔧 `createExtractorProject`

> **File**: `project.ts`

```ts
createExtractorProject(sourceRoot: string, tsConfigPath?: string | undefined): Project
```

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceRoot` | `string` | — |
| `tsConfigPath` | `string or undefined` | — |

**Returns**: `Project` 

**Called By**

- `registerDiagramCommand()` — Cli (`diagram.ts`)
- `registerDriftCommand()` — Cli (`drift.ts`)
- `registerGenerateCommand()` — Cli (`generate.ts`)

### 🔧 `extractLayer`

> **File**: `project.ts`

```ts
extractLayer(project: Project, layer: LayerConfig, allLayers?: LayerConfig[] | undefined, sourceRoot?: string | undefined): LayerExtraction
```

| Parameter | Type | Description |
| --- | --- | --- |
| `project` | `Project` | — |
| `layer` | `LayerConfig` | — |
| `allLayers` | `LayerConfig[] or undefined` | — |
| `sourceRoot` | `string or undefined` | — |

**Returns**: `LayerExtraction` 

**Called By**

- `registerDiagramCommand()` — Cli (`diagram.ts`)
- `registerDriftCommand()` — Cli (`drift.ts`)
- `registerGenerateCommand()` — Cli (`generate.ts`)

### 🔧 `extractTypeAlias`

> **File**: `type-alias-extractor.ts`

```ts
extractTypeAlias(decl: TypeAliasDeclaration, category: string): TypeAliasInfo
```

| Parameter | Type | Description |
| --- | --- | --- |
| `decl` | `TypeAliasDeclaration` | — |
| `category` | `string` | — |

**Returns**: `TypeAliasInfo` 

**Called By**

- `extractLayer()` — Extractor (`project.ts`)
