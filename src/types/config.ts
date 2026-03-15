/** DDDアーキテクチャで使用するレイヤー種別。 */
export type LayerType =
  | "domain"
  | "application"
  | "presentation"
  | "infrastructure"
  | "custom";

/** パターンベースのカテゴリ上書き設定。 */
export interface CategoryOverride {
  pattern: string;
  category: string;
}

/** 単一アーキテクチャレイヤーの設定。 */
export interface LayerConfig {
  name: string;
  nameJa: string;
  path: string;
  type: LayerType;
  description: string;
  responsibility: string;
  forbiddenImports: string[];
  categories: Record<string, string>;
  /** 許可する依存先レイヤー名。省略時はtypeから推論される。 */
  dependsOn?: string[];
  /** ディレクトリベースの解決後に適用される名前パターンベースのカテゴリ上書き。 */
  categoryOverrides?: CategoryOverride[];
  /** フレームワーク固有の抽出に使用するフレームワーク識別子（例: "express"）。 */
  framework?: string;
}

/** layers.yamlから読み込まれるプロジェクト設定。 */
export interface ProjectConfig {
  project: {
    name: string;
    description: string;
    sourceRoot: string;
    /** 生成ドキュメントの表示言語（デフォルト: "en"）。 */
    locale?: "en" | "ja";
  };
  layers: LayerConfig[];
}
