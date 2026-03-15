import type { LayerExtraction, ClassInfo, InterfaceInfo, RouteInfo, ClassCallChain } from "../types/extracted.js";
import type { LayerConfig } from "../types/config.js";

/**
 * ダイアグラムレンダリングのストラテジーインターフェース。
 * 実装クラス（MermaidRenderer、SvgRenderer）はフォーマット固有の
 * Markdownスニペットを生成し、ドキュメントに埋め込める形式で返す。
 */
export interface DiagramRenderer {
  /**
   * レイヤー全体のコンパクトな概要クラス図をレンダリングする。
   * クラス/インターフェース名と関係のみを表示し、メンバー詳細は含まない。
   * @param extraction - レイヤーの抽出結果
   * @returns Markdownスニペット文字列、またはnull
   */
  renderLayerOverview(extraction: LayerExtraction): Promise<string | null>;

  /**
   * クラス/インターフェースグループの詳細クラス図をレンダリングする。
   * プロパティ・メソッドを含む完全なメンバー情報と関係を表示する。
   * @param classes - クラス情報配列
   * @param interfaces - インターフェース情報配列
   * @returns Markdownスニペット文字列、またはnull
   */
  renderDetailClassDiagram(
    classes: ClassInfo[],
    interfaces: InterfaceInfo[],
  ): Promise<string | null>;

  /**
   * クラスコールチェーンのシーケンス図をレンダリングする。
   * @param chain - コールチェーンエントリ
   * @returns Markdownスニペット文字列、またはnull
   */
  renderSequenceDiagram(chain: ClassCallChain): Promise<string | null>;

  /**
   * 単一ルートハンドラーのコールチェーンからシーケンス図をレンダリングする。
   * @param funcName - 関数名
   * @param route - ルート情報
   * @returns Markdownスニペット文字列、またはnull
   */
  renderRouteSequenceDiagram(funcName: string, route: RouteInfo): Promise<string | null>;

  /**
   * レイヤー横断のプロジェクト概要ダイアグラムをレンダリングする。
   * レイヤー別にグループ化した全オブジェクトを表示し、依存違反のみ線を引く。
   * @param extractions - 全レイヤーの抽出結果
   * @param layers - レイヤー設定配列（省略可）
   * @returns Markdownスニペット文字列、またはnull
   */
  renderProjectOverview(extractions: LayerExtraction[], layers?: LayerConfig[]): Promise<string | null>;
}
