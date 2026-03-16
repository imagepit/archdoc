---
title: Drift — ドリフト検出層 API仕様
description: 設定と実態の乖離検出
---

# Drift — ドリフト検出層 API仕様

## 責務と制約

| 項目 | 詳細 |
| --- | --- |
| **パス** | `src/drift/` |
| **責務** | 設定と実態の乖離検出 |
| **禁止インポート** | `src/cli`, `src/diagram`, `src/generator` |

layers.yamlの定義と実際のソースコードの乖離を検出。
未定義レイヤー・未分類ファイルの警告。

## Driftのコンポーネント

### 🔧 `formatDriftReport` 関数

> **ファイル**: `drift-reporter.ts`

ドリフト検出結果を人間が読みやすいテキストレポートに整形する。

```ts
formatDriftReport(result: DriftResult): string
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `result` | `DriftResult` | ドリフト検出結果 |

**戻り値**: `string` テキストレポート文字列

**呼び出し元**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `formatDriftReportMd` 関数

> **ファイル**: `drift-reporter.ts`

ドリフト検出結果をMarkdownレポートに整形する。

```ts
formatDriftReportMd(result: DriftResult): string
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `result` | `DriftResult` | ドリフト検出結果 |

**戻り値**: `string` Markdownレポート文字列

### 🔧 `compareSpecs` 関数

> **ファイル**: `spec-comparator.ts`

2つのレイヤー抽出スナップショットを比較し、仕様ドリフトを検出する。

```ts
compareSpecs(layerName: string, baseline: LayerExtraction, current: LayerExtraction): DriftResult
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `layerName` | `string` | レイヤー名 |
| `baseline` | `LayerExtraction` | ベースライン（前回の抽出結果） |
| `current` | `LayerExtraction` | 現在の抽出結果 |

**戻り値**: `DriftResult` ドリフト検出結果

**呼び出し元**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `saveSpec` 関数

> **ファイル**: `spec-store.ts`

レイヤー抽出スナップショットをJSONファイルに保存する。

```ts
saveSpec(layerName: string, extraction: LayerExtraction): void
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `layerName` | `string` | レイヤー名（ファイル名に使用） |
| `extraction` | `LayerExtraction` | 保存する抽出結果 |

**呼び出し元**

- `registerDriftCommand()` — Cli (`drift.ts`)

### 🔧 `loadSpec` 関数

> **ファイル**: `spec-store.ts`

保存済みのレイヤー抽出スナップショットをJSONファイルから読み込む。

```ts
loadSpec(layerName: string): LayerExtraction | null
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `layerName` | `string` | レイヤー名（ファイル名に使用） |

**戻り値**: `LayerExtraction | null` 抽出結果、またはファイルが存在しない/読み込み失敗時はnull

**呼び出し元**

- `registerDriftCommand()` — Cli (`drift.ts`)
