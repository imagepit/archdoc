---
title: Generator — 生成層 API仕様
description: Markdownドキュメント生成
---

# Generator — 生成層 API仕様

## 責務と制約

| 項目 | 詳細 |
| --- | --- |
| **パス** | `src/generator/` |
| **責務** | Markdownドキュメント生成 |
| **禁止インポート** | `src/cli`, `src/config`, `src/extractor` |

抽出結果からMarkdownドキュメントを生成。
index.md（全体概要）とレイヤー別ドキュメントを出力。

![Generator Class Diagram](diagrams/generator-class.svg)

## Generatorのコンポーネント

![Class Diagram](diagrams/detail-5.svg)

### 🏗️ `MarkdownBuilder` クラス

> **ファイル**: `markdown-builder.ts`
> **型**: Other

Markdownドキュメントをプログラマティックに構築するFluentビルダー。

**メソッド**

#### `frontmatter` メソッド

YAMLフロントマターブロックを追加する。

```ts
frontmatter(data: Record<string, string>): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `data` | `Record<string, string>` | フロントマターのキー/値ペア |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)

#### `heading` メソッド

指定レベルの見出しを追加する。

```ts
heading(level: number, text: string): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `level` | `number` | 見出しレベル（1〜6） |
| `text` | `string` | 見出しテキスト |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

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

#### `paragraph` メソッド

段落テキストを追加する。

```ts
paragraph(text: string): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `text` | `string` | 段落テキスト |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

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

#### `blockquote` メソッド

引用ブロックを追加する。

```ts
blockquote(text: string): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `text` | `string` | 引用テキスト（複数行可） |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)
- `renderDddWarnings()` — Generator (`layer-generator.ts`)

#### `table` メソッド

Markdownテーブルを追加する。

```ts
table(headers: string[], rows: string[][]): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `headers` | `string[]` | ヘッダー文字列配列 |
| `rows` | `string[][]` | データ行の二次元配列 |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)
- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderMethod()` — Generator (`layer-generator.ts`)
- `renderMethodSignature()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)

#### `codeBlock` メソッド

コードブロックを追加する。

```ts
codeBlock(code: string, lang?: string): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `code` | `string` | コード文字列 |
| `lang` | `string` | 言語識別子（デフォルト: "ts"） |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderMethod()` — Generator (`layer-generator.ts`)
- `renderMethodSignature()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

#### `list` メソッド

箇条書きリストを追加する。

```ts
list(items: string[]): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `items` | `string[]` | リスト項目の文字列配列 |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

- `renderClass()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderCalledBy()` — Generator (`layer-generator.ts`)
- `renderMethod()` — Generator (`layer-generator.ts`)

#### `raw` メソッド

テキストをそのままドキュメントに追加する（末尾改行なし）。

```ts
raw(text: string): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `text` | `string` | 追加するテキスト |

**戻り値**: `this` thisを返すメソッドチェーン用

#### `rawBlock` メソッド

テキストをブロックとしてドキュメントに追加する（末尾に空行を追加）。

```ts
rawBlock(text: string): this
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `text` | `string` | 追加するテキスト |

**戻り値**: `this` thisを返すメソッドチェーン用

**呼び出し元**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)
- `renderGroupDiagramAndItems()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderMethodSequenceDiagram()` — Generator (`layer-generator.ts`)
- `renderFunctionSequenceDiagram()` — Generator (`layer-generator.ts`)

#### `build` メソッド

蓄積したすべての行を結合してMarkdown文字列を返す。

```ts
build(): string
```

**戻り値**: `string` 完成したMarkdown文字列

**呼び出し元**

- `generateIndexMd()` — Generator (`index-generator.ts`)
- `generateLayerMd()` — Generator (`layer-generator.ts`)

### 📋 `IndexGenerateOptions` インターフェース

> **ファイル**: `index-generator.ts`
> **型**: Other

ダイアグラムレンダラーを含むindex.md生成オプション。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `renderer` | `DiagramRenderer or undefined` | — | — |
| `messages` | `LocaleMessages or undefined` | — | — |

### 📋 `GenerateOptions` インターフェース

> **ファイル**: `layer-generator.ts`
> **型**: Other

ダイアグラムレンダラーを含むレイヤードキュメント生成オプション。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `renderer` | `DiagramRenderer` | ✓ | — |
| `layerNames` | `string[] or undefined` | — | 依存方向チェック用のレイヤー名順序配列（内側 → 外側） |
| `messages` | `LocaleMessages or undefined` | — | ロケールメッセージ（省略時は英語） |

### 🔧 `kindEmoji` 関数

> **ファイル**: `emoji.ts`

オブジェクト種別に対応する絵文字アイコンを返す。

```ts
kindEmoji(kind: ObjectKind): string
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `kind` | `ObjectKind` | オブジェクト種別 |

**戻り値**: `string` 絵文字文字列

**呼び出し元**

- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

### 🔧 `categoryEmoji` 関数

> **ファイル**: `emoji.ts`

ドメインカテゴリに対応する絵文字アイコンを返す。

```ts
categoryEmoji(category: string): string
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `category` | `string` | カテゴリ名 |

**戻り値**: `string` 絵文字文字列（該当なしの場合は空文字列）

**呼び出し元**

- `formatName()` — Generator (`emoji.ts`)

### 🔧 `formatName` 関数

> **ファイル**: `emoji.ts`

カテゴリ絵文字プレフィックス付きのコンポーネント名を整形する。

```ts
formatName(name: string, kind: ObjectKind, category: string): string
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | コンポーネント名 |
| `kind` | `ObjectKind` | オブジェクト種別 |
| `category` | `string` | カテゴリ名 |

**戻り値**: `string` 整形済みの名前文字列

**呼び出し元**

- `formatComponentWithRole()` — Generator (`index-generator.ts`)
- `renderClass()` — Generator (`layer-generator.ts`)
- `renderInterface()` — Generator (`layer-generator.ts`)
- `renderFunction()` — Generator (`layer-generator.ts`)
- `renderTypeAlias()` — Generator (`layer-generator.ts`)
- `renderEnum()` — Generator (`layer-generator.ts`)
- `renderConst()` — Generator (`layer-generator.ts`)

### 🔧 `kindLabel` 関数

> **ファイル**: `emoji.ts`

絵文字と種別名を組み合わせた表示ラベルを返す。

```ts
kindLabel(kind: ObjectKind): string
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `kind` | `ObjectKind` | オブジェクト種別 |

**戻り値**: `string` 表示ラベル文字列

**呼び出し元**

- `generateIndexMd()` — Generator (`index-generator.ts`)

### 🔧 `kindLegendRows` 関数

> **ファイル**: `emoji.ts`

全オブジェクト種別アイコンの凡例テーブル行を生成する。

```ts
kindLegendRows(messages?: LocaleMessages | undefined): string[][]
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `messages` | `LocaleMessages or undefined` | ロケールメッセージ（省略時は英語） |

**戻り値**: `string[][]` 凡例行の二次元配列

**呼び出し元**

- `generateIndexMd()` — Generator (`index-generator.ts`)

### 🔧 `categoryLegendRows` 関数

> **ファイル**: `emoji.ts`

全カテゴリアイコンの凡例テーブル行を生成する。

```ts
categoryLegendRows(messages?: LocaleMessages | undefined): string[][]
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `messages` | `LocaleMessages or undefined` | ロケールメッセージ（省略時は英語） |

**戻り値**: `string[][]` 凡例行の二次元配列

**呼び出し元**

- `generateIndexMd()` — Generator (`index-generator.ts`)

### 🔧 `generateIndexMd` 関数

> **ファイル**: `index-generator.ts`

プロジェクト全体の概要ドキュメントindex.mdを生成する。

```ts
generateIndexMd(config: ProjectConfig, extractions: LayerExtraction[], options?: IndexGenerateOptions | undefined): Promise<string>
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `config` | `ProjectConfig` | プロジェクト設定 |
| `extractions` | `LayerExtraction[]` | 全レイヤーの抽出結果 |
| `options` | `IndexGenerateOptions or undefined` | 生成オプション（省略可） |

**戻り値**: `Promise<string>` 生成されたMarkdown文字列

**呼び出し元**

- `registerGenerateCommand()` — Cli (`generate.ts`)

### 🔧 `generateLayerMd` 関数

> **ファイル**: `layer-generator.ts`

単一アーキテクチャレイヤーのMarkdownドキュメントを生成する。

```ts
generateLayerMd(layer: LayerConfig, extraction: LayerExtraction, options: GenerateOptions): Promise<string>
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `layer` | `LayerConfig` | レイヤー設定 |
| `extraction` | `LayerExtraction` | レイヤーの抽出結果 |
| `options` | `GenerateOptions` | 生成オプション |

**戻り値**: `Promise<string>` 生成されたMarkdown文字列

**呼び出し元**

- `registerGenerateCommand()` — Cli (`generate.ts`)

### 📝 `ObjectKind` 型エイリアス

> **ファイル**: `emoji.ts`
> **型**: Other

ドキュメント出力で使用するオブジェクト種別。

```typescript
"function" | "class" | "interface" | "type" | "enum" | "const"
```
