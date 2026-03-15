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

ドリフト検出結果を人間が読みやすいテキストレポートに整形する。

```ts
formatDriftReport(result: DriftResult): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `result` | `DriftResult` | ドリフト検出結果 |

**Returns**: `string` テキストレポート文字列

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `formatDriftReportMd`

> **File**: `drift-reporter.ts`

ドリフト検出結果をMarkdownレポートに整形する。

```ts
formatDriftReportMd(result: DriftResult): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `result` | `DriftResult` | ドリフト検出結果 |

**Returns**: `string` Markdownレポート文字列

### 🔧 `compareSpecs`

> **File**: `spec-comparator.ts`

2つのレイヤー抽出スナップショットを比較し、仕様ドリフトを検出する。

```ts
compareSpecs(layerName: string, baseline: LayerExtraction, current: LayerExtraction): DriftResult
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layerName` | `string` | レイヤー名 |
| `baseline` | `LayerExtraction` | ベースライン（前回の抽出結果） |
| `current` | `LayerExtraction` | 現在の抽出結果 |

**Returns**: `DriftResult` ドリフト検出結果

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `saveSpec`

> **File**: `spec-store.ts`

レイヤー抽出スナップショットをJSONファイルに保存する。

```ts
saveSpec(layerName: string, extraction: LayerExtraction): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layerName` | `string` | レイヤー名（ファイル名に使用） |
| `extraction` | `LayerExtraction` | 保存する抽出結果 |

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `loadSpec`

> **File**: `spec-store.ts`

保存済みのレイヤー抽出スナップショットをJSONファイルから読み込む。

```ts
loadSpec(layerName: string): LayerExtraction | null
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layerName` | `string` | レイヤー名（ファイル名に使用） |

**Returns**: `LayerExtraction | null` 抽出結果、またはファイルが存在しない/読み込み失敗時はnull

**Called By**

- `registerDriftCommand()` — Cli (`drift.ts`)
