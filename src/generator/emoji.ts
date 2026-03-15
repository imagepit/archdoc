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

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/Entity|Aggregate/i, "\u{1F4E6}"],       // 📦
  [/Value\s*Object/i, "\u{1F48E}"],          // 💎
  [/Repository/i, "\u{1F5C4}\u{FE0F}"],     // 🗄️
  [/Use\s*Case/i, "\u{2699}\u{FE0F}"],      // ⚙️
  [/Domain\s*Service|Service/i, "\u{1F6E0}\u{FE0F}"], // 🛠️
  [/Router|Controller/i, "\u{1F310}"],       // 🌐
  [/DTO|Dependency\s*Injection/i, "\u{1F4CB}"], // 📋
  [/Middleware|Authentication|Validation/i, "\u{1F6E1}\u{FE0F}"], // 🛡️
  [/Error/i, "\u{274C}"],                    // ❌
  [/Port/i, "\u{1F50C}"],                    // 🔌
  [/External\s*Service/i, "\u{1F517}"],      // 🔗
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
 * @returns 凡例行の二次元配列
 */
export function kindLegendRows(): string[][] {
  return (Object.entries(KIND_EMOJI) as [ObjectKind, string][]).map(
    ([kind, emoji]) => [`${emoji} ${kind}`, kindDescription(kind)],
  );
}

/**
 * 全カテゴリアイコンの凡例テーブル行を生成する。
 * @returns 凡例行の二次元配列
 */
export function categoryLegendRows(): string[][] {
  return CATEGORY_PATTERNS.map(([pattern, emoji]) => [
    `${emoji}`,
    patternToLabel(pattern),
  ]);
}

function kindDescription(kind: ObjectKind): string {
  const descriptions: Record<ObjectKind, string> = {
    class: "Class declaration",
    interface: "Interface declaration",
    function: "Exported function",
    type: "Type alias",
    enum: "Enum declaration",
    const: "Exported constant",
  };
  return descriptions[kind];
}

function patternToLabel(pattern: RegExp): string {
  return pattern.source
    .replace(/\\/g, "")
    .replace(/\|/g, " / ")
    .replace(/s\*/g, " ")
    .replace(/^i$/, "");
}
