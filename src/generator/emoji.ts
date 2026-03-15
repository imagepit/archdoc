import type { LocaleMessages, CategoryKey } from "../i18n/types.js";
import { getMessages } from "../i18n/index.js";

/** ドキュメント出力で使用するオブジェクト種別。 */
export type ObjectKind =
  | "class"
  | "interface"
  | "function"
  | "type"
  | "enum"
  | "const";

const KIND_EMOJI: Record<ObjectKind, string> = {
  class: "\u{1F3D7}\u{FE0F}",       // 🏗️
  interface: "\u{1F4CB}",   // 📋
  function: "\u{1F527}",    // 🔧
  type: "\u{1F4DD}",        // 📝
  enum: "\u{1F522}",        // 🔢
  const: "\u{1F4CC}",       // 📌
};

const CATEGORY_PATTERNS: [RegExp, string, CategoryKey][] = [
  [/Entity|Aggregate/i, "\u{1F4E6}", "entityAggregate"],       // 📦
  [/Value\s*Object/i, "\u{1F48E}", "valueObject"],             // 💎
  [/Repository/i, "\u{1F5C4}\u{FE0F}", "repository"],          // 🗄️
  [/Use\s*Case/i, "\u{2699}\u{FE0F}", "useCase"],              // ⚙️
  [/Domain\s*Service|Service/i, "\u{1F6E0}\u{FE0F}", "domainService"], // 🛠️
  [/Router|Controller/i, "\u{1F310}", "routerController"],      // 🌐
  [/DTO|Dependency\s*Injection/i, "\u{1F4CB}", "dtoDependencyInjection"], // 📋
  [/Middleware|Authentication|Validation/i, "\u{1F6E1}\u{FE0F}", "middlewareAuthValidation"], // 🛡️
  [/Error/i, "\u{274C}", "error"],                              // ❌
  [/Port/i, "\u{1F50C}", "port"],                               // 🔌
  [/External\s*Service/i, "\u{1F517}", "externalService"],      // 🔗
];

/**
 * オブジェクト種別に対応する絵文字アイコンを返す。
 * @param kind - オブジェクト種別
 * @returns 絵文字文字列
 */
export function kindEmoji(kind: ObjectKind): string {
  return KIND_EMOJI[kind];
}

/**
 * ドメインカテゴリに対応する絵文字アイコンを返す。
 * @param category - カテゴリ名
 * @returns 絵文字文字列（該当なしの場合は空文字列）
 */
export function categoryEmoji(category: string): string {
  for (const [pattern, emoji] of CATEGORY_PATTERNS) {
    if (pattern.test(category)) return emoji;
  }
  return "";
}

/**
 * カテゴリ絵文字プレフィックス付きのコンポーネント名を整形する。
 * @param name - コンポーネント名
 * @param kind - オブジェクト種別
 * @param category - カテゴリ名
 * @returns 整形済みの名前文字列
 */
export function formatName(
  name: string,
  kind: ObjectKind,
  category: string,
): string {
  const cat = categoryEmoji(category);
  return cat ? `${cat} \`${name}\`` : `\`${name}\``;
}

/**
 * 絵文字と種別名を組み合わせた表示ラベルを返す。
 * @param kind - オブジェクト種別
 * @returns 表示ラベル文字列
 */
export function kindLabel(kind: ObjectKind): string {
  return `${KIND_EMOJI[kind]} ${kind}`;
}

/**
 * 全オブジェクト種別アイコンの凡例テーブル行を生成する。
 * @param messages - ロケールメッセージ（省略時は英語）
 * @returns 凡例行の二次元配列
 */
export function kindLegendRows(messages?: LocaleMessages): string[][] {
  const t = messages ?? getMessages("en");
  return (Object.entries(KIND_EMOJI) as [ObjectKind, string][]).map(
    ([kind, emoji]) => [`${emoji} ${kind}`, t.kinds[kind]],
  );
}

/**
 * 全カテゴリアイコンの凡例テーブル行を生成する。
 * @param messages - ロケールメッセージ（省略時は英語）
 * @returns 凡例行の二次元配列
 */
export function categoryLegendRows(messages?: LocaleMessages): string[][] {
  const t = messages ?? getMessages("en");
  return CATEGORY_PATTERNS.map(([_pattern, emoji, key]) => [
    `${emoji}`,
    t.categories[key],
  ]);
}
