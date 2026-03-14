---
title: Drift — ドリフト検出層 API Spec
description: 設定と実態の乖離検出
---

# Drift — ドリフト検出層 API Spec

## Responsibilities & Constraints

| Item | Detail |
| --- | --- |
| **Path** | `src/drift/` |
| **Responsibility** | 設定と実態の乖離検出 |
| **Forbidden Imports** | `src/cli`, `src/diagram`, `src/generator` |

layers.yamlの定義と実際のソースコードの乖離を検出。
未定義レイヤー・未分類ファイルの警告。

## Other

### 🔧 `formatDriftReport`

> **File**: `drift-reporter.ts`

```ts
formatDriftReport(result: DriftResult): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `result` | `DriftResult` | — |

**Returns**: `string` 

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `formatDriftReportMd`

> **File**: `drift-reporter.ts`

```ts
formatDriftReportMd(result: DriftResult): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `result` | `DriftResult` | — |

**Returns**: `string` 

### 🔧 `compareSpecs`

> **File**: `spec-comparator.ts`

```ts
compareSpecs(layerName: string, baseline: LayerExtraction, current: LayerExtraction): DriftResult
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layerName` | `string` | — |
| `baseline` | `LayerExtraction` | — |
| `current` | `LayerExtraction` | — |

**Returns**: `DriftResult` 

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `saveSpec`

> **File**: `spec-store.ts`

```ts
saveSpec(layerName: string, extraction: LayerExtraction): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layerName` | `string` | — |
| `extraction` | `LayerExtraction` | — |

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `loadSpec`

> **File**: `spec-store.ts`

```ts
loadSpec(layerName: string): LayerExtraction | null
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layerName` | `string` | — |

**Returns**: `LayerExtraction | null` 

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)
