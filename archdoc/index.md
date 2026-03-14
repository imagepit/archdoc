---
title: System Architecture Overview
description: archdoc DDD layered architecture overview
---

# System Architecture Overview

## Project

| Item | Detail |
| --- | --- |
| **Name** | archdoc |
| **Description** | DDD layered architecture documentation generator |
| **Source Root** | `src/` |

## Layer Overview

| Layer | Path | Responsibility | Forbidden Imports | Details |
| --- | --- | --- | --- | --- |
| **Types** (型定義層) | `src/types/` | 共通型定義の提供 | `src/cli`, `src/config`, `src/diagram`, `src/drift`, `src/extractor`, `src/generator` | [types.md](./types.md) |
| **Config** (設定層) | `src/config/` | 設定ファイルの解析・バリデーション | `src/cli`, `src/diagram`, `src/drift`, `src/extractor`, `src/generator` | [config.md](./config.md) |
| **Extractor** (抽出層) | `src/extractor/` | ソースコードの静的解析と情報抽出 | `src/cli`, `src/diagram`, `src/generator` | [extractor.md](./extractor.md) |
| **Diagram** (ダイアグラム層) | `src/diagram/` | ダイアグラム生成 | `src/cli`, `src/config`, `src/extractor` | [diagram.md](./diagram.md) |
| **Generator** (生成層) | `src/generator/` | Markdownドキュメント生成 | `src/cli`, `src/config`, `src/extractor` | [generator.md](./generator.md) |
| **Drift** (ドリフト検出層) | `src/drift/` | 設定と実態の乖離検出 | `src/cli`, `src/diagram`, `src/generator` | [drift.md](./drift.md) |
| **Cli** (CLI層) | `src/cli/` | CLIインターフェースの提供 | — | [cli.md](./cli.md) |

## Legend

**Kind** — Object type indicators

| Icon | Description |
| --- | --- |
| 🏗️ class | Class declaration |
| 📋 interface | Interface declaration |
| 🔧 function | Exported function |
| 📝 type | Type alias |
| 🔢 enum | Enum declaration |
| 📌 const | Exported constant |

**Category** — Domain category indicators (applied to Component name)

| Icon | Category |
| --- | --- |
| 📦 | Entity / Aggregate |
| 💎 | Value Object |
| 🗄️ | Repository |
| ⚙️ | Use Case |
| 🛠️ | Domain Service / Service |
| 🌐 | Router / Controller |
| 📋 | DTO / Dependency Injection |
| 🛡️ | Middleware / Authentication / Validation |
| ❌ | Error |
| 🔌 | Port |
| 🔗 | External Service |

## Cross-Layer Dependency Violations

![Project Overview](diagrams/project-overview.svg)

## Import Violations

**4 forbidden import(s) detected.**

| Source Layer | File | Forbidden Import | Target Layer |
| --- | --- | --- | --- |
| Diagram | `diagram-renderer.ts` | `../extractor/call-chain-analyzer.js` | Extractor |
| Diagram | `mermaid-renderer.ts` | `../extractor/call-chain-analyzer.js` | Extractor |
| Diagram | `sequence-diagram-builder.ts` | `../extractor/call-chain-analyzer.js` | Extractor |
| Diagram | `svg-renderer.ts` | `../extractor/call-chain-analyzer.js` | Extractor |

## Non-Standard Layer Warnings

以下のレイヤーはDDD標準4層（Domain / Application / Infrastructure / Presentation）に属しません。責務の重複・散在に注意してください。

| Layer | Path | Responsibility |
| --- | --- | --- |
| **Types** (型定義層) | `src/types/` | 共通型定義の提供 |
| **Config** (設定層) | `src/config/` | 設定ファイルの解析・バリデーション |
| **Extractor** (抽出層) | `src/extractor/` | ソースコードの静的解析と情報抽出 |
| **Diagram** (ダイアグラム層) | `src/diagram/` | ダイアグラム生成 |
| **Generator** (生成層) | `src/generator/` | Markdownドキュメント生成 |
| **Drift** (ドリフト検出層) | `src/drift/` | 設定と実態の乖離検出 |
| **Cli** (CLI層) | `src/cli/` | CLIインターフェースの提供 |

### Types (型定義層)

| Component | Kind | Category | Description |
| --- | --- | --- | --- |
| `CategoryOverride` | 📋 interface | Other | — |
| `LayerConfig` | 📋 interface | Other | — |
| `ProjectConfig` | 📋 interface | Other | — |
| `SpecDiff` | 📋 interface | Other | — |
| `DriftResult` | 📋 interface | Other | — |
| `PropertyInfo` | 📋 interface | Other | — |
| `ParameterInfo` | 📋 interface | Other | — |
| `ThrowInfo` | 📋 interface | Other | — |
| `CallerReference` | 📋 interface | Other | — |
| `MethodInfo` | 📋 interface | Other | — |
| `MethodSignatureInfo` | 📋 interface | Other | — |
| `DependencyInfo` | 📋 interface | Other | — |
| `ClassInfo` | 📋 interface | Other | — |
| `InterfaceInfo` | 📋 interface | Other | — |
| `RouteCallInfo` | 📋 interface | Other | — |
| `RouteJSDocTag` | 📋 interface | Other | — |
| `RouteInfo` | 📋 interface | Other | — |
| `FunctionInfo` | 📋 interface | Other | — |
| `TypeAliasInfo` | 📋 interface | Other | — |
| `EnumMemberInfo` | 📋 interface | Other | — |
| `EnumInfo` | 📋 interface | Other | — |
| `ConstInfo` | 📋 interface | Other | — |
| `CallChainEntry` | 📋 interface | Other | — |
| `LayerExtraction` | 📋 interface | Other | — |
| `LayerType` | 📝 type | Other | — |
| `DriftSeverity` | 📝 type | Other | — |

### Config (設定層)

| Component | Kind | Category | Description |
| --- | --- | --- | --- |
| `getDefaultCategories` | 🔧 function | Other | — |
| `loadConfig` | 🔧 function | Other | — |
| `projectConfigSchema` | 📌 const | Other | — |

### Extractor (抽出層)

| Component | Kind | Category | Description |
| --- | --- | --- | --- |
| `ExpressExtractor` | 🏗️ class | Framework Extractor | — |
| `ConstructorDep` | 📋 interface | Other | — |
| `MethodCall` | 📋 interface | Other | — |
| `MethodCallChain` | 📋 interface | Other | — |
| `ClassCallChain` | 📋 interface | Other | — |
| `ParsedJsDoc` | 📋 interface | Other | — |
| `FrameworkExtractor` | 📋 interface | Framework Extractor | — |
| `analyzeCallChains` | 🔧 function | Other | — |
| `analyzeCallerReferences` | 🔧 function | Other | Post-process: analyze caller references for all methods and… |
| `extractClass` | 🔧 function | Other | — |
| `extractConst` | 🔧 function | Other | — |
| `extractEnum` | 🔧 function | Other | — |
| `extractFunction` | 🔧 function | Other | — |
| `analyzeImports` | 🔧 function | Other | — |
| `findForbiddenImports` | 🔧 function | Other | — |
| `extractInterface` | 🔧 function | Other | — |
| `parseJsDoc` | 🔧 function | Other | — |
| `mergeParamDescriptions` | 🔧 function | Other | — |
| `createExtractorProject` | 🔧 function | Other | — |
| `extractLayer` | 🔧 function | Other | — |
| `extractTypeAlias` | 🔧 function | Other | — |
| `createFrameworkExtractor` | 🔧 function | Framework Extractor | — |

### Diagram (ダイアグラム層)

| Component | Kind | Category | Description |
| --- | --- | --- | --- |
| `MermaidRenderer` | 🏗️ class | Other | Mermaid implementation of DiagramRenderer. |
| `SvgRenderer` | 🏗️ class | Other | SVG implementation of DiagramRenderer. |
| `DependencyGraph` | 📋 interface | Other | — |
| `DependencyEdge` | 📋 interface | Other | — |
| `DiagramRenderer` | 📋 interface | Other | Strategy interface for diagram rendering. |
| `buildC4ComponentDiagram` | 🔧 function | Other | — |
| `buildClassDiagram` | 🔧 function | Other | — |
| `buildCompactClassDiagram` | 🔧 function | Other | Build a compact overview class diagram for the entire layer. |
| `buildCategoryClassDiagrams` | 🔧 function | Other | — |
| `buildDependencyGraph` | 🔧 function | Other | — |
| `buildLayerDotDiagram` | 🔧 function | Other | Build a compact overview DOT diagram for the entire layer. |
| `buildDetailDotDiagram` | 🔧 function | Other | Build a DOT diagram with full member details for a group of… |
| `buildProjectOverviewMermaid` | 🔧 function | Other | Build a Mermaid classDiagram showing all objects across all… |
| `buildProjectOverviewDot` | 🔧 function | Other | Build a DOT digraph showing all objects across all layers. |
| `buildRouteSequenceDiagram` | 🔧 function | Other | Build a Mermaid sequence diagram for a single route handler… |
| `buildSequenceDiagram` | 🔧 function | Other | — |
| `buildMultiSequenceDiagrams` | 🔧 function | Other | — |
| `renderDotToSvg` | 🔧 function | Other | — |

### Generator (生成層)

| Component | Kind | Category | Description |
| --- | --- | --- | --- |
| `MarkdownBuilder` | 🏗️ class | Other | — |
| `IndexGenerateOptions` | 📋 interface | Other | — |
| `GenerateOptions` | 📋 interface | Other | — |
| `kindEmoji` | 🔧 function | Other | — |
| `categoryEmoji` | 🔧 function | Other | — |
| `formatName` | 🔧 function | Other | — |
| `kindLabel` | 🔧 function | Other | — |
| `kindLegendRows` | 🔧 function | Other | — |
| `categoryLegendRows` | 🔧 function | Other | — |
| `generateIndexMd` | 🔧 function | Other | — |
| `generateLayerMd` | 🔧 function | Other | — |
| `ObjectKind` | 📝 type | Other | — |

### Drift (ドリフト検出層)

| Component | Kind | Category | Description |
| --- | --- | --- | --- |
| `formatDriftReport` | 🔧 function | Other | — |
| `formatDriftReportMd` | 🔧 function | Other | — |
| `compareSpecs` | 🔧 function | Other | — |
| `saveSpec` | 🔧 function | Other | — |
| `loadSpec` | 🔧 function | Other | — |

### Cli (CLI層)

| Component | Kind | Category | Description |
| --- | --- | --- | --- |
| `createProgram` | 🔧 function | Other | — |
| `registerDiagramCommand` | 🔧 function | Command | — |
| `registerDriftCommand` | 🔧 function | Command | — |
| `registerGenerateCommand` | 🔧 function | Command | — |
| `registerInitCommand` | 🔧 function | Command | — |
