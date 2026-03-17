---
title: archdoc 機能一覧
description: 要件定義書との突き合わせ用に自動生成された機能一覧
---

# archdoc 機能一覧

> このドキュメントは archdoc により自動生成されました。要件定義書・設計書と突き合わせてカバレッジを確認してください。

## レイヤー別機能一覧

### Config

| コンポーネント | 機能 | 説明 |
| --- | --- | --- |
| `(function)` | `getDefaultCategories` | 指定されたレイヤー種別に対応するデフォルトカテゴリマッピングを返す。 |
| `(function)` | `loadConfig` | layers.yamlファイルからプロジェクト設定を読み込みバリデーションする。 |

### Extractor

| コンポーネント | 機能 | 説明 |
| --- | --- | --- |
| `ExpressExtractor` | `extractRoutes` | — |
| `ExpressExtractor` | `resolveMountPrefixes` | — |
| `(function)` | `analyzeCallChains` | エクスポートされた全クラスのコンストラクタインジェクションによるコールチェーンを解析する。 |
| `(function)` | `analyzeFunctionCallChains` | エクスポートされた全関数の引数ベースのコールチェーンを解析する。 |
| `(function)` | `analyzeCallerReferences` | Post-process: analyze caller references for all methods and functions.
Must be called AFTER all layers have been extracted (all source files loaded).
Mutates MethodInfo.calledBy and FunctionInfo.calledBy in-place. |
| `(function)` | `extractClass` | ts-morph ASTを使用してTypeScriptクラス宣言からメタデータを抽出する。 |
| `(function)` | `extractConst` | エクスポートされた定数宣言からメタデータを抽出する。 |
| `(function)` | `extractEnum` | TypeScript enum宣言からメタデータを抽出する。 |
| `(function)` | `extractFunction` | TypeScript関数宣言からメタデータを抽出する。 |
| `(function)` | `analyzeImports` | ソースファイルの全インポート文を解析し、対象レイヤーを特定する。 |
| `(function)` | `findForbiddenImports` | レイヤー設定に基づいて禁止されたクロスレイヤーインポートを検出する。 |
| `(function)` | `extractInterface` | TypeScriptインターフェース宣言からメタデータを抽出する。 |
| `(function)` | `parseJsDoc` | ts-morphノードからJSDocコメントを構造化データに変換する。 |
| `(function)` | `mergeParamDescriptions` | JSDoc |
| `(function)` | `createExtractorProject` | ソースコード解析用のts-morph Projectインスタンスを作成する。 |
| `(function)` | `extractLayer` | 単一アーキテクチャレイヤーから全コンポーネントを抽出する。 |
| `(function)` | `extractTypeAlias` | TypeScript型エイリアス宣言からメタデータを抽出する。 |
| `(function)` | `createFrameworkExtractor` | レイヤー設定に基づいてFrameworkExtractorを生成するファクトリ関数。 |

### Diagram

| コンポーネント | 機能 | 説明 |
| --- | --- | --- |
| `MermaidRenderer` | `renderLayerOverview` | — |
| `MermaidRenderer` | `renderDetailClassDiagram` | — |
| `MermaidRenderer` | `renderSequenceDiagram` | — |
| `MermaidRenderer` | `renderRouteSequenceDiagram` | — |
| `MermaidRenderer` | `renderProjectOverview` | — |
| `MermaidRenderer` | `renderLayerDependency` | — |
| `SvgRenderer` | `renderLayerOverview` | — |
| `SvgRenderer` | `renderDetailClassDiagram` | — |
| `SvgRenderer` | `renderSequenceDiagram` | — |
| `SvgRenderer` | `renderRouteSequenceDiagram` | — |
| `SvgRenderer` | `renderProjectOverview` | — |
| `SvgRenderer` | `renderLayerDependency` | — |
| `(function)` | `buildC4ComponentDiagram` | プロジェクト設定からMermaid構文のC4コンポーネント図を生成する。 |
| `(function)` | `buildClassDiagram` | メンバー情報を含む詳細なMermaidクラス図を生成する。 |
| `(function)` | `buildCompactClassDiagram` | レイヤー全体のコンパクトな概要クラス図を生成する。
クラス/インターフェース名と関係のみを表示し、メンバー詳細は含まない。 |
| `(function)` | `buildCategoryClassDiagrams` | カテゴリ別に分割したクラス図を生成する。 |
| `(function)` | `buildDependencyGraph` | レイヤー抽出結果と設定から依存関係グラフを構築する。 |
| `(function)` | `buildLayerDotDiagram` | レイヤー全体のコンパクトな概要DOTダイアグラムを生成する。
可読性のためノードはクラス/インターフェース名のみ表示し、メンバーは含まない。
詳細なメンバー情報はMarkdownテキスト側に記載される。

カテゴリでグループ化する。全アイテムが単一カテゴリの場合は
サブディレクトリベースのグループ化にフォールバックする。 |
| `(function)` | `buildDetailDotDiagram` | クラス/インターフェースグループの完全なメンバー詳細を含むDOTダイアグラムを生成する。
概要図と同じビジュアルスタイル（カラーサブグラフ、2列グリッド、丸角ノード）を使用する。 |
| `(function)` | `buildProjectOverviewMermaid` | 全レイヤーにわたる全オブジェクトを表示するMermaidクラス図を生成する。
レイヤー横断の依存違反のみ関係線として描画される。 |
| `(function)` | `buildProjectOverviewDot` | 全レイヤーにわたる全オブジェクトを表示するDOTダイアグラムを生成する。
レイヤー横断の依存違反のみ関係線として赤色で描画される。 |
| `(function)` | `buildLayerDependencyMermaid` | エントリーポイントからの依存フローを示すシンプルなMermaidフローチャートを生成する。
各レイヤーはボックスで表示され、実際のインポート依存関係が矢印で描画される。
禁止インポート違反は赤色の破線で表示される。 |
| `(function)` | `buildLayerDependencyDot` | エントリーポイントからの依存フローを示すシンプルなDOTダイアグラムを生成する。
各レイヤーはボックスで表示され、実際のインポート依存関係が矢印で描画される。
禁止インポート違反は赤色の破線で表示される。 |
| `(function)` | `buildRouteSequenceDiagram` | 単一ルートハンドラーのコールチェーンからMermaidシーケンス図を生成する。
MermaidRendererとSvgRenderer（フォールバック）で共有される。 |
| `(function)` | `buildSequenceDiagram` | 単一コールチェーンエントリからMermaidシーケンス図を生成する。 |
| `(function)` | `buildMultiSequenceDiagrams` | 複数コールチェーンからクラス名をキーとするシーケンス図を生成する。 |
| `(function)` | `renderDotToSvg` | DOTグラフ文字列をviz.jsでSVGにレンダリングする。 |

### Generator

| コンポーネント | 機能 | 説明 |
| --- | --- | --- |
| `MarkdownBuilder` | `frontmatter` | YAMLフロントマターブロックを追加する。 |
| `MarkdownBuilder` | `heading` | 指定レベルの見出しを追加する。 |
| `MarkdownBuilder` | `paragraph` | 段落テキストを追加する。 |
| `MarkdownBuilder` | `blockquote` | 引用ブロックを追加する。 |
| `MarkdownBuilder` | `table` | Markdownテーブルを追加する。 |
| `MarkdownBuilder` | `codeBlock` | コードブロックを追加する。 |
| `MarkdownBuilder` | `list` | 箇条書きリストを追加する。 |
| `MarkdownBuilder` | `raw` | テキストをそのままドキュメントに追加する（末尾改行なし）。 |
| `MarkdownBuilder` | `rawBlock` | テキストをブロックとしてドキュメントに追加する（末尾に空行を追加）。 |
| `MarkdownBuilder` | `build` | 蓄積したすべての行を結合してMarkdown文字列を返す。 |
| `(function)` | `kindEmoji` | オブジェクト種別に対応する絵文字アイコンを返す。 |
| `(function)` | `categoryEmoji` | ドメインカテゴリに対応する絵文字アイコンを返す。 |
| `(function)` | `formatName` | カテゴリ絵文字プレフィックス付きのコンポーネント名を整形する。 |
| `(function)` | `kindLabel` | 絵文字と種別名を組み合わせた表示ラベルを返す。 |
| `(function)` | `kindLegendRows` | 全オブジェクト種別アイコンの凡例テーブル行を生成する。 |
| `(function)` | `categoryLegendRows` | 全カテゴリアイコンの凡例テーブル行を生成する。 |
| `(function)` | `generateFeaturesMd` | Generate a feature list Markdown from extracted layer data.
Groups by use case / endpoint / domain model for easy comparison
with free-form requirements documents. |
| `(function)` | `generateIndexMd` | プロジェクト全体の概要ドキュメントindex.mdを生成する。 |
| `(function)` | `generateLayerMd` | 単一アーキテクチャレイヤーのMarkdownドキュメントを生成する。 |

### Drift

| コンポーネント | 機能 | 説明 |
| --- | --- | --- |
| `(function)` | `formatDriftReport` | ドリフト検出結果を人間が読みやすいテキストレポートに整形する。 |
| `(function)` | `formatDriftReportMd` | ドリフト検出結果をMarkdownレポートに整形する。 |
| `(function)` | `compareSpecs` | 2つのレイヤー抽出スナップショットを比較し、仕様ドリフトを検出する。 |
| `(function)` | `saveSpec` | レイヤー抽出スナップショットをJSONファイルに保存する。 |
| `(function)` | `loadSpec` | 保存済みのレイヤー抽出スナップショットをJSONファイルから読み込む。 |

### Cli

| コンポーネント | 機能 | 説明 |
| --- | --- | --- |
| `(function)` | `createProgram` | 全CLIサブコマンドを登録したCommander.jsプログラムを作成する。 |
| `(function)` | `registerDiagramCommand` | 単体ダイアグラム生成用の'diagram'サブコマンドを登録する。 |
| `(function)` | `registerDriftCommand` | 仕様ドリフト検出用の'drift'サブコマンドを登録する。 |
| `(function)` | `registerFeaturesCommand` | Register the 'features' subcommand for feature list generation. |
| `(function)` | `registerGenerateCommand` | ドキュメント生成用の'generate'サブコマンドを登録する。 |
| `(function)` | `registerInitCommand` | layers.yaml初期化用の'init'サブコマンドを登録する。 |
