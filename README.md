# archdoc

TypeScriptソースコードからDDDレイヤードアーキテクチャのAPI仕様書を自動生成するCLIツール。

ts-morphによるAST静的解析でクラス・インターフェース・関数のメタデータを抽出し、レイヤー別のMarkdownドキュメントを生成します。

## 特徴

- **レイヤー別API仕様書の自動生成** — Entity, Value Object, Use Case等のカテゴリ別にMarkdownを出力
- **JSDocカスタムタグ対応** — `@businessRule`, `@throws`, `@param`, `@returns`を自動抽出
- **設計ドリフト検出** — ベースライン保存→実装変更の差分を検出（CI gate対応）
- **Mermaid C4ダイアグラム生成** — レイヤー間依存関係をC4 Componentダイアグラムで可視化
- **auto-discoverモード** — 既存プロジェクトのディレクトリ構造からlayers.yamlを自動生成
- **fumadocs + Vivliostyle互換** — Pure Markdown出力でWeb/PDF両方に対応

## インストール

```bash
pnpm add -D archdoc
```

## クイックスタート

```bash
# 1. layers.yaml を自動生成
npx archdoc init --discover

# 2. layers.yaml を確認・編集

# 3. API仕様書を生成
npx archdoc generate
```

## CLIコマンド

### `archdoc init`

layers.yaml設定ファイルを生成します。

```bash
npx archdoc init              # 最小テンプレートを生成
npx archdoc init --discover   # ディレクトリ構造から自動検出
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--discover` | ディレクトリ構造から自動検出 | false |
| `-s, --source <dir>` | ソースルートディレクトリ | `src` |
| `-o, --output <path>` | 出力パス | `layers.yaml` |

### `archdoc generate`

レイヤー別API仕様Markdownファイルを生成します。

```bash
npx archdoc generate
npx archdoc generate --layer Domain   # 特定レイヤーのみ
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-c, --config <path>` | layers.yamlのパス | `layers.yaml` |
| `-o, --output <dir>` | 出力ディレクトリ | `docs/architecture` |
| `--layer <name>` | 特定レイヤーのみ生成 | 全レイヤー |

### `archdoc drift`

設計仕様と実装の差分を検出します。

```bash
npx archdoc drift --baseline  # ベースラインを保存
npx archdoc drift             # 差分を検出
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-c, --config <path>` | layers.yamlのパス | `layers.yaml` |
| `--baseline` | 現在の実装をベースラインとして保存 | false |
| `--layer <name>` | 特定レイヤーのみチェック | 全レイヤー |

### `archdoc diagram`

Mermaid C4 Componentダイアグラムを生成します。

```bash
npx archdoc diagram
npx archdoc diagram --raw     # .mmdファイルとして出力
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-c, --config <path>` | layers.yamlのパス | `layers.yaml` |
| `-o, --output <dir>` | 出力ディレクトリ | `docs/architecture` |
| `--raw` | Markdownではなく.mmdファイルとして出力 | false |

## layers.yaml

レイヤー定義は`layers.yaml`で管理します。

```yaml
project:
  name: ECオーダーシステム
  description: 注文管理を行うECシステム
  sourceRoot: src

layers:
  - name: Domain
    nameJa: ドメイン層
    path: src/domain
    type: domain
    description: ビジネスルールとドメインモデルの定義
    responsibility: ビジネスルール・ドメインモデルの定義
    forbiddenImports:
      - src/infrastructure
      - src/presentation
    categories:
      entities: Entity
      valueObjects: Value Object
      repositories: Repository Interface
      services: Domain Service
```

### レイヤータイプ

| type | デフォルトカテゴリ |
|------|-------------------|
| `domain` | Entity, Value Object, Repository Interface, Domain Service |
| `application` | Use Case, Application Service, DTO |
| `presentation` | Controller, Handler, Middleware |
| `infrastructure` | Repository Implementation, Adapter, External Client |
| `custom` | （なし — categories必須） |

## JSDocタグ規約

archdocが抽出するJSDocタグ:

```typescript
/**
 * 注文を表すドメインオブジェクト。
 *
 * @businessRule 注文明細は必ず1件以上必要
 * @businessRule キャンセル済み注文への明細追加は不可
 */
export class Order {
  /**
   * 注文明細を追加する。
   *
   * @param item - 追加する注文明細
   * @throws {OrderNotEditableError} 注文が編集不可ステータスの場合
   * @returns 更新後の合計金額
   * @businessRule 同一productIdの明細が存在する場合、数量を合算する
   */
  addItem(item: OrderItem): Money { ... }
}
```

## 出力例

生成されるMarkdownの構成:

```
docs/architecture/
├── index.md           # システム概要（レイヤー一覧・コンポーネント表）
├── domain.md          # ドメイン層 API仕様
├── application.md     # アプリケーション層 API仕様
├── presentation.md    # プレゼンテーション層 API仕様
└── infrastructure.md  # インフラストラクチャ層 API仕様
```

## ライセンス

MIT
