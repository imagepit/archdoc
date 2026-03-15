import type {
  LayerExtraction,
  ClassInfo,
  InterfaceInfo,
} from "../types/extracted.js";

/**
 * メンバー情報を含む詳細なMermaidクラス図を生成する。
 * @param extraction - レイヤーの抽出結果
 * @returns Mermaidクラス図文字列
 */
export function buildClassDiagram(extraction: LayerExtraction): string {
  const classes = extraction.classes.filter((c) => c.isExported);
  const interfaces = extraction.interfaces.filter((i) => i.isExported);

  if (classes.length === 0 && interfaces.length === 0) {
    return "";
  }

  return buildDiagramFromItems(classes, interfaces);
}

/**
 * レイヤー全体のコンパクトな概要クラス図を生成する。
 * クラス/インターフェース名と関係のみを表示し、メンバー詳細は含まない。
 * @param extraction - レイヤーの抽出結果
 * @returns Mermaidクラス図文字列
 */
export function buildCompactClassDiagram(extraction: LayerExtraction): string {
  const classes = deduplicateByName(extraction.classes.filter((c) => c.isExported));
  const interfaces = deduplicateByName(extraction.interfaces.filter((i) => i.isExported));

  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = ["classDiagram", "  direction LR"];

  // Render compact nodes (name only, no members)
  for (const iface of interfaces) {
    lines.push(`  class ${iface.name} {`);
    lines.push(`    <<interface>>`);
    lines.push("  }");
  }

  for (const cls of classes) {
    lines.push(`  class ${cls.name}`);
  }

  // All known names
  const allNames = new Set([
    ...classes.map((c) => c.name),
    ...interfaces.map((i) => i.name),
  ]);

  // Inheritance & implementation relationships
  for (const cls of classes) {
    if (cls.extendsClass && allNames.has(cls.extendsClass)) {
      lines.push(`  ${cls.extendsClass} <|-- ${cls.name}`);
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(`  ${impl} <|.. ${cls.name}`);
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(`  ${ext} <|-- ${iface.name}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * カテゴリ別に分割したクラス図を生成する。
 * @param classes - クラス情報配列
 * @param interfaces - インターフェース情報配列
 * @returns クラス図文字列の配列
 */
export function buildCategoryClassDiagrams(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string[] {
  const exportedClasses = classes.filter((c) => c.isExported);
  const exportedInterfaces = interfaces.filter((i) => i.isExported);

  const total = exportedClasses.length + exportedInterfaces.length;
  if (total === 0) return [];

  // Single diagram per category with direction LR for vertical layout
  const diagram = buildDiagramFromItems(exportedClasses, exportedInterfaces);
  return diagram ? [diagram] : [];
}

function buildDiagramFromItems(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string {
  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = ["classDiagram", "  direction LR"];

  for (const iface of interfaces) {
    renderInterfaceMembers(lines, iface);
  }

  for (const cls of classes) {
    renderClassMembers(lines, cls);
  }

  // All known names in this diagram scope
  const allNames = new Set([
    ...classes.map((c) => c.name),
    ...interfaces.map((i) => i.name),
  ]);

  // Inheritance & implementation relationships
  for (const cls of classes) {
    if (cls.extendsClass && allNames.has(cls.extendsClass)) {
      lines.push(`  ${cls.extendsClass} <|-- ${cls.name}`);
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(`  ${impl} <|.. ${cls.name}`);
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(`  ${ext} <|-- ${iface.name}`);
      }
    }
  }

  // Composition & association relationships based on property types
  const compositionLines = detectPropertyRelationships(classes, interfaces, allNames);
  lines.push(...compositionLines);

  return lines.join("\n");
}

/**
 * プロパティ型を分析してコンポジション/関連関係を検出する。
 * プロパティ型がダイアグラム内の別クラス/インターフェースを参照する場合、
 * コレクション型は (*--)、単一参照は (-->) の矢印を追加する。
 */
function detectPropertyRelationships(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
  allNames: Set<string>,
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  // Check class properties
  for (const cls of classes) {
    detectPropsRelationships(cls.name, cls.properties, allNames, seen, lines);
  }

  // Check interface properties
  for (const iface of interfaces) {
    detectPropsRelationships(iface.name, iface.properties, allNames, seen, lines);
  }

  return lines;
}

function detectPropsRelationships(
  ownerName: string,
  properties: { name: string; type: string }[],
  allNames: Set<string>,
  seen: Set<string>,
  lines: string[],
): void {
  for (const prop of properties) {
    for (const targetName of allNames) {
      if (targetName === ownerName) continue;

      if (!typeReferences(prop.type, targetName)) continue;

      const key = `${ownerName}->${targetName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (isCollectionType(prop.type, targetName)) {
        lines.push(`  ${ownerName} *-- ${targetName} : ${prop.name}`);
      } else {
        lines.push(`  ${ownerName} --> ${targetName} : ${prop.name}`);
      }
      break;
    }
  }
}

/**
 * 型文字列が指定のクラス/インターフェース名を参照しているか確認する。
 * 誤検知を防ぐため単語境界でマッチする（例: "OrderItem" は "Order" にマッチしない）。
 * @param typeStr - 確認対象の型文字列
 * @param name - 検索するクラス/インターフェース名
 * @returns 参照している場合はtrue
 */
function typeReferences(typeStr: string, name: string): boolean {
  const regex = new RegExp(`\\b${escapeRegex(name)}\\b`);
  return regex.test(typeStr);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 型がターゲット型のコレクションを表しているか確認する。
 * @param typeStr - 確認対象の型文字列
 * @param targetName - ターゲット型名
 * @returns コレクション型の場合はtrue
 */
function isCollectionType(typeStr: string, targetName: string): boolean {
  return (
    typeStr.includes(`${targetName}[]`) ||
    typeStr.includes(`Array<${targetName}>`) ||
    typeStr.includes(`ReadonlyArray<${targetName}>`) ||
    typeStr.includes(`Set<${targetName}>`) ||
    (typeStr.includes(`Map<`) && typeStr.includes(targetName))
  );
}

function renderInterfaceMembers(lines: string[], iface: InterfaceInfo): void {
  lines.push(`  class ${iface.name} {`);
  lines.push(`    <<interface>>`);

  for (const prop of iface.properties) {
    lines.push(`    +${prop.name}: ${sanitizeType(prop.type)}`);
  }

  for (const method of iface.methods) {
    lines.push(`    +${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
  }

  lines.push("  }");
}

function renderClassMembers(lines: string[], cls: ClassInfo): void {
  lines.push(`  class ${cls.name} {`);

  for (const prop of cls.properties) {
    const vis = visibilityPrefix(prop.visibility);
    lines.push(`    ${vis}${prop.name}: ${sanitizeType(prop.type)}`);
  }

  for (const method of cls.methods) {
    const vis = visibilityPrefix(method.visibility);
    lines.push(`    ${vis}${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
  }

  lines.push("  }");
}

function visibilityPrefix(vis: "public" | "protected" | "private"): string {
  switch (vis) {
    case "public":
      return "+";
    case "protected":
      return "#";
    case "private":
      return "-";
  }
}

function sanitizeType(type: string): string {
  let result = type.replace(/\n/g, " ");

  // Collapse object literals like { foo: string; bar: number } → Object
  result = collapseObjectLiterals(result);

  result = result
    .replace(/</g, "~")
    .replace(/>/g, "~")
    .replace(/\|/g, " or ");

  return result;
}

function collapseObjectLiterals(type: string): string {
  let result = type;
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/\{[^{}]*\}/g, "Object");
  }
  return result;
}

function formatParams(
  params: { name: string; type: string }[],
): string {
  if (params.length === 0) return "";
  return params
    .map((p) => `${p.name}: ${sanitizeType(p.type)}`)
    .join(", ");
}

function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}
