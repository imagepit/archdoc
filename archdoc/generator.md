---
title: Generator — 生成層 API Spec
description: Markdownドキュメント生成
---

# Generator — 生成層 API Spec

## Responsibilities & Constraints

| Item | Detail |
| --- | --- |
| **Path** | `src/generator/` |
| **Responsibility** | Markdownドキュメント生成 |
| **Forbidden Imports** | `src/cli`, `src/config`, `src/extractor` |

抽出結果からMarkdownドキュメントを生成。
index.md（全体概要）とレイヤー別ドキュメントを出力。

![Generator Class Diagram](diagrams/generator-class.svg)

## Other

![Class Diagram](diagrams/detail-5.svg)

### 🏗️ `MarkdownBuilder`

> **File**: `markdown-builder.ts`
> **Type**: Other

Markdownドキュメントをプログラマティックに構築するFluentビルダー。

**Methods**

#### `frontmatter(data: Record<string, string>): this`

YAMLフロントマターブロックを追加する。

| Parameter | Type | Description |
| --- | --- | --- |
| `data` | `Record<string, string>` | フロントマターのキー/値ペア |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)

#### `heading(level: number, text: string): this`

指定レベルの見出しを追加する。

| Parameter | Type | Description |
| --- | --- | --- |
| `level` | `number` | 見出しレベル（1〜6） |
| `text` | `string` | 見出しテキスト |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)
- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderMethod()` — Generator (`layer-generator.ts`)
- `renderMethodSignature()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

#### `paragraph(text: string): this`

段落テキストを追加する。

| Parameter | Type | Description |
| --- | --- | --- |
| `text` | `string` | 段落テキスト |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)
- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderCalledBy()` — Generator (`layer-generator.ts`)
- `renderMethod()` — Generator (`layer-generator.ts`)
- `renderMethodSignature()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

#### `blockquote(text: string): this`

引用ブロックを追加する。

| Parameter | Type | Description |
| --- | --- | --- |
| `text` | `string` | 引用テキスト（複数行可） |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

#### `table(headers: string[], rows: string[][]): this`

Markdownテーブルを追加する。

| Parameter | Type | Description |
| --- | --- | --- |
| `headers` | `string[]` | ヘッダー文字列配列 |
| `rows` | `string[][]` | データ行の二次元配列 |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)
- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderMethod()` — Generator (`layer-generator.ts`)
- `renderMethodSignature()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)

#### `codeBlock(code: string, lang?: string): this`

コードブロックを追加する。

| Parameter | Type | Description |
| --- | --- | --- |
| `code` | `string` | コード文字列 |
| `lang` | `string` | 言語識別子（デフォルト: "ts"） |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

#### `list(items: string[]): this`

箇条書きリストを追加する。

| Parameter | Type | Description |
| --- | --- | --- |
| `items` | `string[]` | リスト項目の文字列配列 |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `renderClass()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderCalledBy()` — Generator (`layer-generator.ts`)
- `renderMethod()` — Generator (`layer-generator.ts`)

#### `raw(text: string): this`

テキストをそのままドキュメントに追加する（末尾改行なし）。

| Parameter | Type | Description |
| --- | --- | --- |
| `text` | `string` | 追加するテキスト |

**Returns**: `this` thisを返すメソッドチェーン用

#### `rawBlock(text: string): this`

テキストをブロックとしてドキュメントに追加する（末尾に空行を追加）。

| Parameter | Type | Description |
| --- | --- | --- |
| `text` | `string` | 追加するテキスト |

**Returns**: `this` thisを返すメソッドチェーン用

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)
- `renderGroupDiagramAndItems()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderMethodSequenceDiagram()` — Generator (`layer-generator.ts`)
- `renderFunctionSequenceDiagram()` — Generator (`layer-generator.ts`)

#### `build(): string`

蓄積したすべての行を結合してMarkdown文字列を返す。

**Returns**: `string` 完成したMarkdown文字列

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)

### 📋 `IndexGenerateOptions`

> **File**: `index-generator.ts`
> **Type**: Other

ダイアグラムレンダラーを含むindex.md生成オプション。

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `renderer` | `DiagramRenderer or undefined` | — | — |

### 📋 `GenerateOptions`

> **File**: `layer-generator.ts`
> **Type**: Other

ダイアグラムレンダラーを含むレイヤードキュメント生成オプション。

**Properties**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `renderer` | `DiagramRenderer` | ✓ | — |
| `layerNames` | `string[] or undefined` | — | 依存方向チェック用のレイヤー名順序配列（内側 → 外側） |

### 🔧 `kindEmoji`

> **File**: `emoji.ts`

オブジェクト種別に対応する絵文字アイコンを返す。

```ts
kindEmoji(kind: ObjectKind): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `kind` | `ObjectKind` | オブジェクト種別 |

**Returns**: `string` 絵文字文字列

**Called By**

- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

### 🔧 `categoryEmoji`

> **File**: `emoji.ts`

ドメインカテゴリに対応する絵文字アイコンを返す。

```ts
categoryEmoji(category: string): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `category` | `string` | カテゴリ名 |

**Returns**: `string` 絵文字文字列（該当なしの場合は空文字列）

**Called By**

- `formatName()` — Generator (`emoji.ts`)

### 🔧 `formatName`

> **File**: `emoji.ts`

カテゴリ絵文字プレフィックス付きのコンポーネント名を整形する。

```ts
formatName(name: string, kind: ObjectKind, category: string): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | コンポーネント名 |
| `kind` | `ObjectKind` | オブジェクト種別 |
| `category` | `string` | カテゴリ名 |

**Returns**: `string` 整形済みの名前文字列

**Called By**

- `addComponent()` — Generator (`index-generator.ts`)
- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

### 🔧 `kindLabel`

> **File**: `emoji.ts`

絵文字と種別名を組み合わせた表示ラベルを返す。

```ts
kindLabel(kind: ObjectKind): string
```

| Parameter | Type | Description |
| --- | --- | --- |
| `kind` | `ObjectKind` | オブジェクト種別 |

**Returns**: `string` 表示ラベル文字列

**Called By**

- `addComponent()` — Generator (`index-generator.ts`)

### 🔧 `kindLegendRows`

> **File**: `emoji.ts`

全オブジェクト種別アイコンの凡例テーブル行を生成する。

```ts
kindLegendRows(): string[][]
```

**Returns**: `string[][]` 凡例行の二次元配列

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)

### 🔧 `categoryLegendRows`

> **File**: `emoji.ts`

全カテゴリアイコンの凡例テーブル行を生成する。

```ts
categoryLegendRows(): string[][]
```

**Returns**: `string[][]` 凡例行の二次元配列

**Called By**

- `generateIndexMd()` — Generator (`index-generator.ts`)

### 🔧 `generateIndexMd`

> **File**: `index-generator.ts`

プロジェクト全体の概要ドキュメントindex.mdを生成する。

```ts
generateIndexMd(config: ProjectConfig, extractions: LayerExtraction[], options?: IndexGenerateOptions | undefined): Promise<string>
```

| Parameter | Type | Description |
| --- | --- | --- |
| `config` | `ProjectConfig` | プロジェクト設定 |
| `extractions` | `LayerExtraction[]` | 全レイヤーの抽出結果 |
| `options` | `IndexGenerateOptions or undefined` | 生成オプション（省略可） |

**Returns**: `Promise<string>` 生成されたMarkdown文字列

**Called By**

- `registerGenerateCommand()` — Cli (`generate.ts`)

### 🔧 `generateLayerMd`

> **File**: `layer-generator.ts`

単一アーキテクチャレイヤーのMarkdownドキュメントを生成する。

```ts
generateLayerMd(layer: LayerConfig, extraction: LayerExtraction, options: GenerateOptions): Promise<string>
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layer` | `LayerConfig` | レイヤー設定 |
| `extraction` | `LayerExtraction` | レイヤーの抽出結果 |
| `options` | `GenerateOptions` | 生成オプション |

**Returns**: `Promise<string>` 生成されたMarkdown文字列

**Called By**

- `registerGenerateCommand()` — Cli (`generate.ts`)

### 📝 `ObjectKind`

> **File**: `emoji.ts`
> **Type**: Other

ドキュメント出力で使用するオブジェクト種別。

```typescript
"function" | "class" | "interface" | "type" | "enum" | "const"
```
