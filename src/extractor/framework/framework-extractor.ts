import type { SourceFile } from "ts-morph";
import type { RouteInfo, FunctionInfo } from "../../types/extracted.js";

/** フレームワーク固有のルート抽出用ストラテジーインターフェース。 */
export interface FrameworkExtractor {
  extractRoutes(sourceFile: SourceFile, funcName: string): RouteInfo[];

  /**
   * 後処理ステップ: app.use() / router.use() のマウントパターンを解決し、
   * サブルーターのルートにプレフィックスを付与する。
   * @param layerSourceFiles - 抽出対象レイヤー内のソースファイル群
   * @param allSourceFiles - プロジェクト全体のソースファイル群（app.tsなどのapp.use()検出用）
   * @param functions - ルートを更新する対象の抽出済み関数群
   */
  resolveMountPrefixes(
    layerSourceFiles: SourceFile[],
    allSourceFiles: SourceFile[],
    functions: FunctionInfo[],
  ): void;
}
