---
title: システムアーキテクチャ概要
description: archdoc DDDレイヤードアーキテクチャ概要
---

# システムアーキテクチャ概要

## プロジェクト

| 項目 | 詳細 |
| --- | --- |
| **名前** | archdoc |
| **説明** | DDD layered architecture documentation generator |
| **ソースルート** | `src/` |

## レイヤー

### レイヤー一覧

| レイヤー | パス | 責務 | 禁止インポート | 詳細 |
| --- | --- | --- | --- | --- |
| **Types** (型定義層) | `src/types/` | 共通型定義の提供 | `src/cli`, `src/config`, `src/diagram`, `src/drift`, `src/extractor`, `src/generator` | [types.md](./types.md) |
| **Config** (設定層) | `src/config/` | 設定ファイルの解析・バリデーション | `src/cli`, `src/diagram`, `src/drift`, `src/extractor`, `src/generator` | [config.md](./config.md) |
| **Extractor** (抽出層) | `src/extractor/` | ソースコードの静的解析と情報抽出 | `src/cli`, `src/diagram`, `src/generator` | [extractor.md](./extractor.md) |
| **Diagram** (ダイアグラム層) | `src/diagram/` | ダイアグラム生成 | `src/cli`, `src/config`, `src/extractor` | [diagram.md](./diagram.md) |
| **Generator** (生成層) | `src/generator/` | Markdownドキュメント生成 | `src/cli`, `src/config`, `src/extractor` | [generator.md](./generator.md) |
| **Drift** (ドリフト検出層) | `src/drift/` | 設定と実態の乖離検出 | `src/cli`, `src/diagram`, `src/generator` | [drift.md](./drift.md) |
| **Cli** (CLI層) | `src/cli/` | CLIインターフェースの提供 | — | [cli.md](./cli.md) |

### レイヤー依存関係

![Layer Dependency](diagrams/layer-dependency.svg)

![Project Overview](diagrams/project-overview.svg)

### インタラクティブコンポーネント図

<div style="position:relative;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin:16px 0;">
  <iframe src="diagrams/component-graph.html" width="100%" height="500" frameborder="0" style="border:none;"></iframe>
  <div style="position:absolute;top:8px;right:8px;display:flex;gap:6px;">
    <a href="diagrams/component-graph.html" target="_blank" style="padding:6px 12px;background:#1976d2;color:#fff;border-radius:4px;text-decoration:none;font-size:13px;">Open Full View</a>
  </div>
</div>

### 非標準レイヤー警告

以下のレイヤーはDDD標準4層（Domain / Application / Infrastructure / Presentation）に属しません。責務の重複・散在に注意してください。

| レイヤー | パス | 責務 |
| --- | --- | --- |
| **Types** (型定義層) | `src/types/` | 共通型定義の提供 |
| **Config** (設定層) | `src/config/` | 設定ファイルの解析・バリデーション |
| **Extractor** (抽出層) | `src/extractor/` | ソースコードの静的解析と情報抽出 |
| **Diagram** (ダイアグラム層) | `src/diagram/` | ダイアグラム生成 |
| **Generator** (生成層) | `src/generator/` | Markdownドキュメント生成 |
| **Drift** (ドリフト検出層) | `src/drift/` | 設定と実態の乖離検出 |
| **Cli** (CLI層) | `src/cli/` | CLIインターフェースの提供 |

## コンポーネント

### 凡例

**種別** — オブジェクト種別の表示アイコン

| アイコン | 説明 |
| --- | --- |
| 🏗️ class | クラス宣言 |
| 📋 interface | インターフェース宣言 |
| 🔧 function | エクスポート関数 |
| 📝 type | 型エイリアス |
| 🔢 enum | 列挙型宣言 |
| 📌 const | エクスポート定数 |

**カテゴリ** — ドメインカテゴリの表示アイコン（コンポーネント名に適用）

| アイコン | カテゴリ |
| --- | --- |
| 📦 | エンティティ / 集約 |
| 💎 | 値オブジェクト |
| 🗄️ | リポジトリ |
| ⚙️ | ユースケース |
| 🛠️ | ドメインサービス / サービス |
| 🌐 | ルーター / コントローラー |
| 📋 | DTO / 依存性注入 |
| 🛡️ | ミドルウェア / 認証 / バリデーション |
| ❌ | エラー |
| 🔌 | ポート |
| 🔗 | 外部サービス |

### Types (型定義層)

#### config.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `CategoryOverride` | 📋 interface | パターンベースのカテゴリ上書き設定。 |
| `LayerConfig` | 📋 interface | 単一アーキテクチャレイヤーの設定。 |
| `ProjectConfig` | 📋 interface | layers.yamlから読み込まれるプロジェクト設定。 |
| `LayerType` | 📝 type | DDDアーキテクチャで使用するレイヤー種別。 |

#### drift.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `SpecDiff` | 📋 interface | 2つの仕様スナップショット間で検出された単一の差分。 |
| `DriftResult` | 📋 interface | レイヤーのドリフト検出結果。 |
| `DriftSeverity` | 📝 type | 仕様ドリフト検出の重大度レベル。 |

#### extracted.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `DddWarning` | 📋 interface | DDD設計原則に反する構造を検出した警告。 |
| `PropertyInfo` | 📋 interface | クラスまたはインターフェースから抽出されたプロパティ情報。 |
| `ParameterInfo` | 📋 interface | 関数またはメソッドから抽出された引数情報。 |
| `ThrowInfo` | 📋 interface | JSDoc |
| `CallerReference` | 📋 interface | このメソッドまたは関数を呼び出しているコンポーネントの参照情報。 |
| `MethodInfo` | 📋 interface | シグネチャ・引数・ビジネスルールを含むメソッド情報。 |
| `MethodSignatureInfo` | 📋 interface | インターフェース宣言から抽出されたメソッドシグネチャ。 |
| `DependencyInfo` | 📋 interface | レイヤー間のインポート依存関係（禁止インポート検出含む）。 |
| `ClassInfo` | 📋 interface | プロパティ・メソッド・依存関係を含むクラス情報。 |
| `InterfaceInfo` | 📋 interface | プロパティ・メソッドシグネチャを含むインターフェース情報。 |
| `RouteCallInfo` | 📋 interface | Expressルートハンドラ内のメソッド呼び出し。 |
| `RouteJSDocTag` | 📋 interface | Expressルートハンドラから抽出されたJSDocタグ。 |
| `RouteInfo` | 📋 interface | ミドルウェアとコールチェーンを含むExpressルート定義。 |
| `FunctionInfo` | 📋 interface | シグネチャ・引数・ルート情報を含む関数情報。 |
| `TypeAliasInfo` | 📋 interface | 型エイリアスの抽出情報。 |
| `EnumMemberInfo` | 📋 interface | enum宣言の個別メンバー情報。 |
| `EnumInfo` | 📋 interface | enum宣言の抽出情報。 |
| `ConstInfo` | 📋 interface | エクスポートされた定数の抽出情報。 |
| `ConstructorDep` | 📋 interface | コールチェーン解析用のコンストラクタ依存パラメータ。 |
| `MethodCall` | 📋 interface | クラスメソッドまたは関数内での依存先への単一メソッド呼び出し。 |
| `MethodCallChain` | 📋 interface | 単一メソッド内のすべての依存先呼び出し。 |
| `ClassCallChain` | 📋 interface | クラスまたは関数の完全なコールチェーン（依存先とメソッド呼び出しを含む）。 |
| `CallChainEntry` | 📋 interface | LayerExtractionに格納されるシリアライズ可能なコールチェーンエントリ。 |
| `LayerExtraction` | 📋 interface | 単一アーキテクチャレイヤーの完全な抽出結果。 |
| `DddRole` | 📝 type | DDDにおけるドメインモデルの役割分類。 |
| `DddWarningType` | 📝 type | DDD構造警告の種別。 |

### Config (設定層)

#### defaults.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `getDefaultCategories` | 🔧 function | 指定されたレイヤー種別に対応するデフォルトカテゴリマッピングを返す。 |

#### loader.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `loadConfig` | 🔧 function | layers.yamlファイルからプロジェクト設定を読み込みバリデーションする。 |

#### schema.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `projectConfigSchema` | 📌 const | layers.yamlプロジェクト設定のバリデーション用Zodスキーマ。 |

### Extractor (抽出層)

#### framework/express-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `ExpressExtractor` | 🏗️ class | FrameworkExtractorを実装するExpress.jsルート抽出器。 |

#### framework/nextjs-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `NextjsExtractor` | 🏗️ class | Next.js App Router route handler extractor. |
| `NextjsComponentInfo` | 📋 interface | Metadata for a Next.js component file. |
| `classifyNextjsComponent` | 🔧 function | Extract page and layout metadata from a Next.js App Router … |
| `extractServerActions` | 🔧 function | Extract Server Action functions from a file with "use serve… |

#### jsdoc-parser.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `ParsedJsDoc` | 📋 interface | 説明文・引数・throws・ビジネスルールを含むJSDoc解析結果。 |
| `parseJsDoc` | 🔧 function | ts-morphノードからJSDocコメントを構造化データに変換する。 |
| `mergeParamDescriptions` | 🔧 function | JSDoc |

#### framework/framework-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `FrameworkExtractor` | 📋 interface | フレームワーク固有のルート抽出用ストラテジーインターフェース。 |

#### call-chain-analyzer.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `analyzeCallChains` | 🔧 function | エクスポートされた全クラスのコンストラクタインジェクションによるコールチェーンを解析する。 |
| `analyzeFunctionCallChains` | 🔧 function | エクスポートされた全関数の引数ベースのコールチェーンを解析する。 |

#### caller-analyzer.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `analyzeCallerReferences` | 🔧 function | Post-process: analyze caller references for all methods and… |

#### class-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `extractClass` | 🔧 function | ts-morph ASTを使用してTypeScriptクラス宣言からメタデータを抽出する。 |

#### const-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `extractConst` | 🔧 function | エクスポートされた定数宣言からメタデータを抽出する。 |

#### enum-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `extractEnum` | 🔧 function | TypeScript enum宣言からメタデータを抽出する。 |

#### function-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `extractFunction` | 🔧 function | TypeScript関数宣言からメタデータを抽出する。 |

#### import-analyzer.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `analyzeImports` | 🔧 function | ソースファイルの全インポート文を解析し、対象レイヤーを特定する。 |
| `findForbiddenImports` | 🔧 function | レイヤー設定に基づいて禁止されたクロスレイヤーインポートを検出する。 |

#### interface-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `extractInterface` | 🔧 function | TypeScriptインターフェース宣言からメタデータを抽出する。 |

#### project.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `createExtractorProject` | 🔧 function | ソースコード解析用のts-morph Projectインスタンスを作成する。 |
| `extractLayer` | 🔧 function | 単一アーキテクチャレイヤーから全コンポーネントを抽出する。 |

#### type-alias-extractor.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `extractTypeAlias` | 🔧 function | TypeScript型エイリアス宣言からメタデータを抽出する。 |

#### framework/index.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `createFrameworkExtractor` | 🔧 function | レイヤー設定に基づいてFrameworkExtractorを生成するファクトリ関数。 |

### Diagram (ダイアグラム層)

#### mermaid-renderer.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `MermaidRenderer` | 🏗️ class | DiagramRendererのMermaid実装。 |

#### svg-renderer.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `SvgRenderer` | 🏗️ class | DiagramRendererのSVG実装。 |
| `renderDotToSvg` | 🔧 function | DOTグラフ文字列をviz.jsでSVGにレンダリングする。 |

#### cytoscape-data-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `CytoscapeNode` | 📋 interface | — |
| `CytoscapeEdge` | 📋 interface | — |
| `CytoscapeElements` | 📋 interface | — |
| `buildCytoscapeElements` | 🔧 function | Build Cytoscape.js elements JSON from archdoc extraction da… |

#### dependency-graph.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `DependencyGraph` | 📋 interface | レイヤー間依存関係を表すグラフ構造。 |
| `DependencyEdge` | 📋 interface | 依存関係グラフの単一有向辺。 |
| `buildDependencyGraph` | 🔧 function | レイヤー抽出結果と設定から依存関係グラフを構築する。 |

#### diagram-renderer.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `DiagramRenderer` | 📋 interface | ダイアグラムレンダリングのストラテジーインターフェース。 |

#### c4-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `buildC4ComponentDiagram` | 🔧 function | プロジェクト設定からMermaid構文のC4コンポーネント図を生成する。 |

#### class-diagram-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `buildClassDiagram` | 🔧 function | メンバー情報を含む詳細なMermaidクラス図を生成する。 |
| `buildCompactClassDiagram` | 🔧 function | レイヤー全体のコンパクトな概要クラス図を生成する。 |
| `buildCategoryClassDiagrams` | 🔧 function | カテゴリ別に分割したクラス図を生成する。 |

#### cytoscape-html-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `buildCytoscapeHtml` | 🔧 function | Build a standalone HTML file with Cytoscape.js interactive … |

#### dot-class-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `buildLayerDotDiagram` | 🔧 function | レイヤー全体のコンパクトな概要DOTダイアグラムを生成する。 |
| `buildDetailDotDiagram` | 🔧 function | クラス/インターフェースグループの完全なメンバー詳細を含むDOTダイアグラムを生成する。 |

#### project-overview-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `buildProjectOverviewMermaid` | 🔧 function | 全レイヤーにわたる全オブジェクトを表示するMermaidクラス図を生成する。 |
| `buildProjectOverviewDot` | 🔧 function | 全レイヤーにわたる全オブジェクトを表示するDOTダイアグラムを生成する。 |
| `buildLayerDependencyMermaid` | 🔧 function | エントリーポイントからの依存フローを示すシンプルなMermaidフローチャートを生成する。 |
| `buildLayerDependencyDot` | 🔧 function | エントリーポイントからの依存フローを示すシンプルなDOTダイアグラムを生成する。 |

#### route-sequence-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `buildRouteSequenceDiagram` | 🔧 function | 単一ルートハンドラーのコールチェーンからMermaidシーケンス図を生成する。 |

#### sequence-diagram-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `buildSequenceDiagram` | 🔧 function | 単一コールチェーンエントリからMermaidシーケンス図を生成する。 |
| `buildMultiSequenceDiagrams` | 🔧 function | 複数コールチェーンからクラス名をキーとするシーケンス図を生成する。 |

### Generator (生成層)

#### markdown-builder.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `MarkdownBuilder` | 🏗️ class | Markdownドキュメントをプログラマティックに構築するFluentビルダー。 |

#### features-generator.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `FeaturesGenerateOptions` | 📋 interface | Options for features generation. |
| `generateFeaturesMd` | 🔧 function | Generate a feature list Markdown from extracted layer data. |

#### index-generator.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `IndexGenerateOptions` | 📋 interface | ダイアグラムレンダラーを含むindex.md生成オプション。 |
| `generateIndexMd` | 🔧 function | プロジェクト全体の概要ドキュメントindex.mdを生成する。 |

#### layer-generator.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `GenerateOptions` | 📋 interface | ダイアグラムレンダラーを含むレイヤードキュメント生成オプション。 |
| `generateLayerMd` | 🔧 function | 単一アーキテクチャレイヤーのMarkdownドキュメントを生成する。 |

#### cycle-section.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `generateCycleSection` | 🔧 function | Generate a Markdown section for layer circular dependency w… |

#### emoji.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `kindEmoji` | 🔧 function | オブジェクト種別に対応する絵文字アイコンを返す。 |
| `categoryEmoji` | 🔧 function | ドメインカテゴリに対応する絵文字アイコンを返す。 |
| `formatName` | 🔧 function | カテゴリ絵文字プレフィックス付きのコンポーネント名を整形する。 |
| `kindLabel` | 🔧 function | 絵文字と種別名を組み合わせた表示ラベルを返す。 |
| `kindLegendRows` | 🔧 function | 全オブジェクト種別アイコンの凡例テーブル行を生成する。 |
| `categoryLegendRows` | 🔧 function | 全カテゴリアイコンの凡例テーブル行を生成する。 |
| `ObjectKind` | 📝 type | ドキュメント出力で使用するオブジェクト種別。 |

#### responsibility-section.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `generateResponsibilitySection` | 🔧 function | Generate a Markdown section for Next.js responsibility sepa… |

### Drift (ドリフト検出層)

#### drift-reporter.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `formatDriftReport` | 🔧 function | ドリフト検出結果を人間が読みやすいテキストレポートに整形する。 |
| `formatDriftReportMd` | 🔧 function | ドリフト検出結果をMarkdownレポートに整形する。 |

#### spec-comparator.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `compareSpecs` | 🔧 function | 2つのレイヤー抽出スナップショットを比較し、仕様ドリフトを検出する。 |

#### spec-store.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `saveSpec` | 🔧 function | レイヤー抽出スナップショットをJSONファイルに保存する。 |
| `loadSpec` | 🔧 function | 保存済みのレイヤー抽出スナップショットをJSONファイルから読み込む。 |

### Cli (CLI層)

#### index.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `createProgram` | 🔧 function | 全CLIサブコマンドを登録したCommander.jsプログラムを作成する。 |

#### commands/diagram.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `registerDiagramCommand` | 🔧 function | 単体ダイアグラム生成用の'diagram'サブコマンドを登録する。 |

#### commands/drift.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `registerDriftCommand` | 🔧 function | 仕様ドリフト検出用の'drift'サブコマンドを登録する。 |

#### commands/features.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `registerFeaturesCommand` | 🔧 function | Register the 'features' subcommand for feature list generat… |

#### commands/generate.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `registerGenerateCommand` | 🔧 function | ドキュメント生成用の'generate'サブコマンドを登録する。 |

#### commands/init.ts

| コンポーネント | 種別 | 説明 |
| --- | --- | --- |
| `registerInitCommand` | 🔧 function | layers.yaml初期化用の'init'サブコマンドを登録する。 |
