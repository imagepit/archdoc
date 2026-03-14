---
title: Diagram — ダイアグラム層 API Spec
description: ダイアグラム生成
---

# Diagram — ダイアグラム層 API Spec

## Responsibilities & Constraints

| Item | Detail |
| --- | --- |
| **Path** | `src/diagram/` |
| **Responsibility** | ダイアグラム生成 |
| **Forbidden Imports** | `src/cli`, `src/config`, `src/extractor` |

Mermaid/DOT形式のアーキテクチャ図を生成。
レイヤー間依存関係・オブジェクト関連図のレンダリング。

![Diagram Class Diagram](diagrams/diagram-class.svg)

## Other

![Class Diagram](diagrams/detail-4.svg)

### 🏗️ `MermaidRenderer`

> **File**: `mermaid-renderer.ts`
> **Type**: Other

Mermaid implementation of DiagramRenderer.
Returns Mermaid code blocks ready to embed in Markdown.

**Methods**

#### `renderLayerOverview(extraction: LayerExtraction): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `extraction` | `LayerExtraction` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `generateLayerMd()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderDetailClassDiagram(classes: ClassInfo[], interfaces: InterfaceInfo[]): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `classes` | `ClassInfo[]` | — |
| `interfaces` | `InterfaceInfo[]` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `renderGroupDiagramAndItems()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderSequenceDiagram(chain: ClassCallChain): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `chain` | `ClassCallChain` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `renderMethodSequenceDiagram()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderRouteSequenceDiagram(funcName: string, route: RouteInfo): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `funcName` | `string` | — |
| `route` | `RouteInfo` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `renderFunction()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderProjectOverview(extractions: LayerExtraction[], layers?: LayerConfig[] | undefined): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `extractions` | `LayerExtraction[]` | — |
| `layers` | `LayerConfig[] or undefined` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`) via `DiagramRenderer`

### 🏗️ `SvgRenderer`

> **File**: `svg-renderer.ts`
> **Type**: Other

SVG implementation of DiagramRenderer.
Generates DOT → SVG files and returns Markdown image references.

**Methods**

#### `renderLayerOverview(extraction: LayerExtraction): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `extraction` | `LayerExtraction` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `generateLayerMd()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderDetailClassDiagram(classes: ClassInfo[], interfaces: InterfaceInfo[]): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `classes` | `ClassInfo[]` | — |
| `interfaces` | `InterfaceInfo[]` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `renderGroupDiagramAndItems()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderSequenceDiagram(chain: ClassCallChain): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `chain` | `ClassCallChain` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `renderMethodSequenceDiagram()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderRouteSequenceDiagram(funcName: string, route: RouteInfo): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `funcName` | `string` | — |
| `route` | `RouteInfo` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `renderFunction()` — Generator (`layer-generator.ts`) via `DiagramRenderer`

#### `renderProjectOverview(extractions: LayerExtraction[], layers?: LayerConfig[] | undefined): Promise<string | null>`

| Parameter | Type | Description |
| --- | --- | --- |
| `extractions` | `LayerExtraction[]` | — |
| `layers` | `LayerConfig[] or undefined` | — |

**Returns**: `Promise<string or null>` 

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`) via `DiagramRenderer`

### 📋 `DependencyGraph`

> **File**: `dependency-graph.ts`
> **Type**: Other

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | `string[]` | ✓ | — |
| `edges` | `DependencyEdge[]` | ✓ | — |

### 📋 `DependencyEdge`

> **File**: `dependency-graph.ts`
> **Type**: Other

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `source` | `string` | ✓ | — |
| `target` | `string` | ✓ | — |
| `count` | `number` | ✓ | — |
| `isForbidden` | `boolean` | ✓ | — |

### 📋 `DiagramRenderer`

> **File**: `diagram-renderer.ts`
> **Type**: Other

Strategy interface for diagram rendering.
Implementations (MermaidRenderer, SvgRenderer) produce format-specific
markdown snippets ready to embed in documentation.

**Methods**

#### `renderLayerOverview(extraction: LayerExtraction): Promise<string | null>`

Render a compact overview class diagram for the entire layer.
Shows class/interface names and relationships only (no member details).

| Parameter | Type | Description |
| --- | --- | --- |
| `extraction` | `LayerExtraction` | — |

**Returns**: `Promise<string or null>` 

#### `renderDetailClassDiagram(classes: ClassInfo[], interfaces: InterfaceInfo[]): Promise<string | null>`

Render a detailed class diagram for a group of classes/interfaces.
Shows full member details (properties, methods) with relationships.

| Parameter | Type | Description |
| --- | --- | --- |
| `classes` | `ClassInfo[]` | — |
| `interfaces` | `InterfaceInfo[]` | — |

**Returns**: `Promise<string or null>` 

#### `renderSequenceDiagram(chain: ClassCallChain): Promise<string | null>`

Render a sequence diagram for a class call chain.

| Parameter | Type | Description |
| --- | --- | --- |
| `chain` | `ClassCallChain` | — |

**Returns**: `Promise<string or null>` 

#### `renderRouteSequenceDiagram(funcName: string, route: RouteInfo): Promise<string | null>`

Render a sequence diagram for a single route handler call chain.

| Parameter | Type | Description |
| --- | --- | --- |
| `funcName` | `string` | — |
| `route` | `RouteInfo` | — |

**Returns**: `Promise<string or null>` 

#### `renderProjectOverview(extractions: LayerExtraction[], layers?: LayerConfig[] | undefined): Promise<string | null>`

Render a cross-layer project overview diagram.
Shows all objects grouped by layer. Only dependency violations are drawn.

| Parameter | Type | Description |
| --- | --- | --- |
| `extractions` | `LayerExtraction[]` | — |
| `layers` | `LayerConfig[] or undefined` | — |

**Returns**: `Promise<string or null>` 

### 🔧 `buildC4ComponentDiagram`

> **File**: `c4-builder.ts`

```ts
buildC4ComponentDiagram(config: ProjectConfig, graph: DependencyGraph): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `config` | `ProjectConfig` | — |
| `graph` | `DependencyGraph` | — |

**Returns**: `string` 

**Called By**

- `registerDiagramCommand()` — Cli (`diagram.ts`)

### 🔧 `buildClassDiagram`

> **File**: `class-diagram-builder.ts`

```ts
buildClassDiagram(extraction: LayerExtraction): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `extraction` | `LayerExtraction` | — |

**Returns**: `string` 

### 🔧 `buildCompactClassDiagram`

> **File**: `class-diagram-builder.ts`

Build a compact overview class diagram for the entire layer.
Shows only class/interface names (no member details) with relationships.

```ts
buildCompactClassDiagram(extraction: LayerExtraction): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `extraction` | `LayerExtraction` | — |

**Returns**: `string` 

**Called By**

- `MermaidRenderer.renderLayerOverview()` — Diagram (`mermaid-renderer.ts`)

### 🔧 `buildCategoryClassDiagrams`

> **File**: `class-diagram-builder.ts`

```ts
buildCategoryClassDiagrams(classes: ClassInfo[], interfaces: InterfaceInfo[]): string[]
```

| Parameter | Type | Description |
| --- | --- | --- |
| `classes` | `ClassInfo[]` | — |
| `interfaces` | `InterfaceInfo[]` | — |

**Returns**: `string[]` 

**Called By**

- `MermaidRenderer.renderDetailClassDiagram()` — Diagram (`mermaid-renderer.ts`)

### 🔧 `buildDependencyGraph`

> **File**: `dependency-graph.ts`

```ts
buildDependencyGraph(config: ProjectConfig, extractions: LayerExtraction[]): DependencyGraph
```

| Parameter | Type | Description |
| --- | --- | --- |
| `config` | `ProjectConfig` | — |
| `extractions` | `LayerExtraction[]` | — |

**Returns**: `DependencyGraph` 

**Called By**

- `registerDiagramCommand()` — Cli (`diagram.ts`)

### 🔧 `buildLayerDotDiagram`

> **File**: `dot-class-builder.ts`

Build a compact overview DOT diagram for the entire layer.
Nodes show only class/interface name (no members) for readability.
Detailed member info is in the Markdown text.

Groups by category. If all items share a single category,
falls back to subDirectory-based grouping.

```ts
buildLayerDotDiagram(extraction: LayerExtraction): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `extraction` | `LayerExtraction` | — |

**Returns**: `string` 

**Called By**

- `SvgRenderer.renderLayerOverview()` — Diagram (`svg-renderer.ts`)

### 🔧 `buildDetailDotDiagram`

> **File**: `dot-class-builder.ts`

Build a DOT diagram with full member details for a group of classes/interfaces.
Uses the same visual style as the overview (colored subgraph, 2-column grid, rounded nodes).

```ts
buildDetailDotDiagram(classes: ClassInfo[], interfaces: InterfaceInfo[]): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `classes` | `ClassInfo[]` | — |
| `interfaces` | `InterfaceInfo[]` | — |

**Returns**: `string` 

**Called By**

- `SvgRenderer.renderDetailClassDiagram()` — Diagram (`svg-renderer.ts`)

### 🔧 `buildProjectOverviewMermaid`

> **File**: `project-overview-builder.ts`

Build a Mermaid classDiagram showing all objects across all layers.
Only cross-layer dependency violations are drawn as relationship lines.

```ts
buildProjectOverviewMermaid(extractions: LayerExtraction[], layers?: LayerConfig[] | undefined): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `extractions` | `LayerExtraction[]` | — |
| `layers` | `LayerConfig[] or undefined` | — |

**Returns**: `string` 

**Called By**

- `MermaidRenderer.renderProjectOverview()` — Diagram (`mermaid-renderer.ts`)

### 🔧 `buildProjectOverviewDot`

> **File**: `project-overview-builder.ts`

Build a DOT digraph showing all objects across all layers.
Only cross-layer dependency violations are drawn as relationship lines (in red).

```ts
buildProjectOverviewDot(extractions: LayerExtraction[], layers?: LayerConfig[] | undefined): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `extractions` | `LayerExtraction[]` | — |
| `layers` | `LayerConfig[] or undefined` | — |

**Returns**: `string` 

**Called By**

- `SvgRenderer.renderProjectOverview()` — Diagram (`svg-renderer.ts`)

### 🔧 `buildRouteSequenceDiagram`

> **File**: `route-sequence-builder.ts`

Build a Mermaid sequence diagram for a single route handler call chain.
Shared between MermaidRenderer and SvgRenderer (fallback).

```ts
buildRouteSequenceDiagram(funcName: string, route: RouteInfo): string | null
```

| Parameter | Type | Description |
| --- | --- | --- |
| `funcName` | `string` | — |
| `route` | `RouteInfo` | — |

**Returns**: `string | null` 

**Called By**

- `MermaidRenderer.renderRouteSequenceDiagram()` — Diagram (`mermaid-renderer.ts`)
- `SvgRenderer.renderRouteSequenceDiagram()` — Diagram (`svg-renderer.ts`)

### 🔧 `buildSequenceDiagram`

> **File**: `sequence-diagram-builder.ts`

```ts
buildSequenceDiagram(chain: ClassCallChain): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `chain` | `ClassCallChain` | — |

**Returns**: `string` 

**Called By**

- `buildMultiSequenceDiagrams()` — Diagram (`sequence-diagram-builder.ts`)
- `MermaidRenderer.renderSequenceDiagram()` — Diagram (`mermaid-renderer.ts`)
- `SvgRenderer.renderSequenceDiagram()` — Diagram (`svg-renderer.ts`)

### 🔧 `buildMultiSequenceDiagrams`

> **File**: `sequence-diagram-builder.ts`

```ts
buildMultiSequenceDiagrams(chains: ClassCallChain[]): Map<string, string>
```

| Parameter | Type | Description |
| --- | --- | --- |
| `chains` | `ClassCallChain[]` | — |

**Returns**: `Map<string, string>` 

### 🔧 `renderDotToSvg`

> **File**: `svg-renderer.ts`

```ts
renderDotToSvg(dotCode: string, engine?: "dot" | "fdp" | "neato"): Promise<string>
```

| Parameter | Type | Description |
| --- | --- | --- |
| `dotCode` | `string` | — |
| `engine` | `"dot" or "fdp" or "neato"` | — |

**Returns**: `Promise<string>` 

**Called By**

- `SvgRenderer.renderLayerOverview()` — Diagram (`svg-renderer.ts`)
- `SvgRenderer.renderDetailClassDiagram()` — Diagram (`svg-renderer.ts`)
- `SvgRenderer.renderProjectOverview()` — Diagram (`svg-renderer.ts`)
