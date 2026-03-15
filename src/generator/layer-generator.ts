import { MarkdownBuilder } from "./markdown-builder.js";
import type { LayerConfig } from "../types/config.js";
import type {
  LayerExtraction,
  ClassInfo,
  InterfaceInfo,
  FunctionInfo,
  TypeAliasInfo,
  EnumInfo,
  ConstInfo,
  MethodInfo,
  MethodSignatureInfo,
  CallerReference,
} from "../types/extracted.js";
import type { CallChainEntry } from "../types/extracted.js";
import type { DiagramRenderer } from "../diagram/diagram-renderer.js";
import { formatName, kindEmoji, type ObjectKind } from "./emoji.js";

/** ダイアグラムレンダラーを含むレイヤードキュメント生成オプション。 */
export interface GenerateOptions {
  renderer: DiagramRenderer;
  /** 依存方向チェック用のレイヤー名順序配列（内側 → 外側） */
  layerNames?: string[];
}

/**
 * 単一アーキテクチャレイヤーのMarkdownドキュメントを生成する。
 * @param layer - レイヤー設定
 * @param extraction - レイヤーの抽出結果
 * @param options - 生成オプション
 * @returns 生成されたMarkdown文字列
 */
export async function generateLayerMd(
  layer: LayerConfig,
  extraction: LayerExtraction,
  options: GenerateOptions,
): Promise<string> {
  const md = new MarkdownBuilder();
  const { renderer, layerNames } = options;
  const selfLayerName = layer.name;

  md.frontmatter({
    title: `${layer.name} — ${layer.nameJa} API Spec`,
    description: layer.responsibility,
  });

  md.heading(1, `${layer.name} — ${layer.nameJa} API Spec`);

  md.heading(2, "Responsibilities & Constraints");

  md.table(
    ["Item", "Detail"],
    [
      ["**Path**", `\`${layer.path}/\``],
      ["**Responsibility**", layer.responsibility],
      [
        "**Forbidden Imports**",
        layer.forbiddenImports.length > 0
          ? layer.forbiddenImports.map((f) => `\`${f}\``).join(", ")
          : "—",
      ],
    ],
  );

  if (layer.description) {
    md.paragraph(layer.description.trim());
  }

  // Layer-level overview diagram (compact)
  const overview = await renderer.renderLayerOverview(extraction);
  if (overview) {
    md.rawBlock(overview);
  }

  const categories = groupByCategory(extraction);

  for (const [category, items] of categories) {
    md.heading(2, category);

    // Check if items span multiple subdirectories
    const subDirGroups = groupBySubDirectory(items);

    if (subDirGroups.size > 1) {
      // Multiple subdirectories: create sub-sections per subdirectory
      for (const [subDir, subItems] of subDirGroups) {
        const subDirLabel = formatSubDirLabel(subDir);
        md.heading(3, subDirLabel);

        await renderGroupDiagramAndItems(
          md,
          subItems,
          extraction.callChains,
          renderer,
          4,
          selfLayerName,
          layerNames,
        );
      }
    } else {
      // Single group (or no subdirectory): render as before
      await renderGroupDiagramAndItems(
        md,
        items,
        extraction.callChains,
        renderer,
        3,
        selfLayerName,
        layerNames,
      );
    }
  }

  return md.build();
}

interface CategorizedItem {
  kind: ObjectKind;
  data: ClassInfo | InterfaceInfo | FunctionInfo | TypeAliasInfo | EnumInfo | ConstInfo;
}

/**
 * グループのクラス図と個別アイテムをレンダリングする。
 * headingLevel でクラス/インターフェース見出しの開始レベルを制御する。
 * @param md - Markdownビルダー
 * @param items - レンダリング対象のアイテム配列
 * @param callChains - コールチェーンエントリ配列
 * @param renderer - ダイアグラムレンダラー
 * @param headingLevel - 見出しレベル
 * @param selfLayerName - 自レイヤー名（省略可）
 * @param layerNames - 全レイヤー名の順序配列（省略可）
 */
async function renderGroupDiagramAndItems(
  md: MarkdownBuilder,
  items: CategorizedItem[],
  callChains: CallChainEntry[],
  renderer: DiagramRenderer,
  headingLevel: number,
  selfLayerName?: string,
  layerNames?: string[],
): Promise<void> {
  const catClasses = items
    .filter((i) => i.kind === "class")
    .map((i) => i.data as ClassInfo);
  const catInterfaces = items
    .filter((i) => i.kind === "interface")
    .map((i) => i.data as InterfaceInfo);

  const detailDiagram = await renderer.renderDetailClassDiagram(catClasses, catInterfaces);
  if (detailDiagram) {
    md.rawBlock(detailDiagram);
  }

  for (const item of items) {
    switch (item.kind) {
      case "class":
        await renderClass(md, item.data as ClassInfo, headingLevel, selfLayerName, layerNames, callChains, renderer);
        break;
      case "interface":
        renderInterface(md, item.data as InterfaceInfo, headingLevel);
        break;
      case "function":
        await renderFunction(md, item.data as FunctionInfo, headingLevel, selfLayerName, layerNames, callChains, renderer);
        break;
      case "type":
        renderTypeAlias(md, item.data as TypeAliasInfo, headingLevel);
        break;
      case "enum":
        renderEnum(md, item.data as EnumInfo, headingLevel);
        break;
      case "const":
        renderConst(md, item.data as ConstInfo, headingLevel);
        break;
    }
  }
}

function groupByCategory(
  extraction: LayerExtraction,
): Map<string, CategorizedItem[]> {
  const map = new Map<string, CategorizedItem[]>();
  const seen = new Set<string>();

  for (const cls of extraction.classes) {
    const key = `class:${cls.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(cls.category) ?? [];
    items.push({ kind: "class", data: cls });
    map.set(cls.category, items);
  }

  for (const iface of extraction.interfaces) {
    const key = `interface:${iface.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(iface.category) ?? [];
    items.push({ kind: "interface", data: iface });
    map.set(iface.category, items);
  }

  for (const func of extraction.functions) {
    const key = `function:${func.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(func.category) ?? [];
    items.push({ kind: "function", data: func });
    map.set(func.category, items);
  }

  for (const ta of extraction.typeAliases) {
    const key = `type:${ta.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(ta.category) ?? [];
    items.push({ kind: "type", data: ta });
    map.set(ta.category, items);
  }

  for (const en of extraction.enums) {
    const key = `enum:${en.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(en.category) ?? [];
    items.push({ kind: "enum", data: en });
    map.set(en.category, items);
  }

  for (const c of extraction.constants) {
    const key = `const:${c.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = map.get(c.category) ?? [];
    items.push({ kind: "const", data: c });
    map.set(c.category, items);
  }

  return map;
}

/**
 * アイテムをsubDirectoryフィールドでグループ化する。
 * subDirectoryが空のアイテムは "" キーでグループ化される。
 * @param items - グループ化対象のアイテム配列
 * @returns サブディレクトリをキーとするアイテムのMap
 */
function groupBySubDirectory(
  items: CategorizedItem[],
): Map<string, CategorizedItem[]> {
  const map = new Map<string, CategorizedItem[]>();

  for (const item of items) {
    const subDir = getSubDirectory(item);
    const group = map.get(subDir) ?? [];
    group.push(item);
    map.set(subDir, group);
  }

  return map;
}

function getSubDirectory(item: CategorizedItem): string {
  return (item.data as { subDirectory?: string }).subDirectory ?? "";
}

/**
 * サブディレクトリパスを読みやすいセクションラベルに整形する。
 * 例: "order" → "Order"、"create-order" → "Create Order"
 * @param subDir - サブディレクトリパス
 * @returns 整形済みラベル文字列
 */
function formatSubDirLabel(subDir: string): string {
  if (!subDir) return "General";
  return subDir
    .split("/")
    .map((segment) =>
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
    .join(" / ");
}

async function renderClass(
  md: MarkdownBuilder,
  cls: ClassInfo,
  headingLevel: number = 3,
  selfLayerName?: string,
  layerNames?: string[],
  callChains?: CallChainEntry[],
  renderer?: DiagramRenderer,
): Promise<void> {
  md.heading(headingLevel, `${kindEmoji("class")} ${formatName(cls.name, "class", cls.category)}`);

  md.blockquote(
    [
      `**File**: \`${getFilename(cls.filePath)}\``,
      `**Type**: ${cls.category}`,
    ].join("\n"),
  );

  if (cls.description) {
    md.paragraph(cls.description);
  }

  if (cls.businessRules.length > 0) {
    md.paragraph("**Business Rules**");
    md.list(cls.businessRules);
  }

  if (cls.properties.length > 0) {
    md.paragraph("**Properties**");
    md.table(
      ["Property", "Type", "Required", "Description"],
      cls.properties.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (cls.methods.length > 0) {
    md.paragraph("**Methods**");
    for (const method of cls.methods) {
      renderMethod(md, method, headingLevel + 1, selfLayerName, layerNames);
      if (callChains && renderer) {
        await renderMethodSequenceDiagram(md, cls.name, method.name, callChains, renderer);
      }
    }
  }
}

function renderInterface(
  md: MarkdownBuilder,
  iface: InterfaceInfo,
  headingLevel: number = 3,
): void {
  md.heading(headingLevel, `${kindEmoji("interface")} ${formatName(iface.name, "interface", iface.category)}`);

  md.blockquote(
    [
      `**File**: \`${getFilename(iface.filePath)}\``,
      `**Type**: ${iface.category}`,
    ].join("\n"),
  );

  if (iface.description) {
    md.paragraph(iface.description);
  }

  if (iface.properties.length > 0) {
    md.paragraph("**Properties**");
    md.table(
      ["Property", "Type", "Required", "Description"],
      iface.properties.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (iface.methods.length > 0) {
    md.paragraph("**Methods**");
    for (const method of iface.methods) {
      renderMethodSignature(md, method, headingLevel + 1);
    }
  }
}

async function renderFunction(
  md: MarkdownBuilder,
  func: FunctionInfo,
  headingLevel: number = 3,
  selfLayerName?: string,
  layerNames?: string[],
  callChains?: CallChainEntry[],
  renderer?: DiagramRenderer,
): Promise<void> {
  md.heading(headingLevel, `${kindEmoji("function")} ${formatName(func.name, "function", func.category)}`);

  md.blockquote(`**File**: \`${getFilename(func.filePath)}\``);

  if (func.description) {
    md.paragraph(func.description);
  }

  md.codeBlock(func.signature);

  if (func.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      func.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (func.returnType && func.returnType !== "void") {
    md.paragraph(`**Returns**: \`${func.returnType}\` ${func.returnDescription || ""}`);
  }

  if (func.throws.length > 0) {
    md.paragraph("**Throws**");
    md.table(
      ["Error", "Description"],
      func.throws.map((t) => [t.type ? `\`${t.type}\`` : "—", t.description]),
    );
  }

  renderCalledBy(md, func.calledBy, selfLayerName, layerNames);

  if (func.businessRules.length > 0) {
    md.paragraph("**Business Rules**");
    md.list(func.businessRules);
  }

  if (callChains && renderer) {
    await renderFunctionSequenceDiagram(md, func.name, callChains, renderer);
  }

  if (func.routes && func.routes.length > 0 && renderer) {
    md.paragraph("**Routes**");
    md.table(
      ["Method", "Path", "Middleware"],
      func.routes.map((r) => [
        `\`${r.method}\``,
        `\`${r.path}\``,
        r.middlewares.length > 0
          ? r.middlewares.map((m) => `\`${m}\``).join(", ")
          : "—",
      ]),
    );

    for (const route of func.routes) {
      md.heading(headingLevel + 1, `${route.method} ${route.path}`);
      if (route.middlewares.length > 0) {
        md.paragraph(`**Middleware**: ${route.middlewares.map((m) => `\`${m}\``).join(", ")}`);
      }
      if (route.description) {
        md.paragraph(route.description);
      }
      if (route.jsdocTags && route.jsdocTags.length > 0) {
        const params = route.jsdocTags.filter((t) => t.tag === "param");
        const returns = route.jsdocTags.filter((t) => t.tag === "returns");
        const throws = route.jsdocTags.filter((t) => t.tag === "throws");
        if (params.length > 0) {
          md.table(
            ["Parameter", "Description"],
            params.map((p) => [`\`${p.name}\``, p.description]),
          );
        }
        if (returns.length > 0) {
          md.paragraph(`**Returns**: ${returns.map((r) => r.description).join(", ")}`);
        }
        if (throws.length > 0) {
          md.paragraph(`**Throws**: ${throws.map((t) => t.description).join(", ")}`);
        }
      }
      if (route.calls.length > 0) {
        const diagram = await renderer.renderRouteSequenceDiagram(func.name, route);
        if (diagram) md.rawBlock(diagram);
      }
    }
  }
}

function renderCalledBy(
  md: MarkdownBuilder,
  calledBy?: CallerReference[],
  selfLayerName?: string,
  layerNames?: string[],
): void {
  if (!calledBy || calledBy.length === 0) return;
  md.paragraph("**Called By**");
  md.list(
    calledBy.map((c) => {
      const file = getFilename(c.filePath);
      const layer = c.layerName ? ` — ${c.layerName}` : "";
      if (c.callType === "interface" && c.interfaceName) {
        return `\`${c.callerName}\`${layer} (\`${file}\`) via \`${c.interfaceName}\``;
      }
      if (c.callType === "direct" && isInwardToOutwardCall(c.layerName, selfLayerName, layerNames)) {
        return `\u26a0\ufe0f \`${c.callerName}\`${layer} (\`${file}\`)`;
      }
      return `\`${c.callerName}\`${layer} (\`${file}\`)`;
    }),
  );
}

function renderMethod(
  md: MarkdownBuilder,
  method: MethodInfo,
  headingLevel: number = 4,
  selfLayerName?: string,
  layerNames?: string[],
): void {
  md.heading(headingLevel, `\`${method.signature}\``);

  if (method.description) {
    md.paragraph(method.description);
  }

  if (method.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `**Returns**: \`${sanitizeTableType(method.returnType)}\` ${method.returnDescription || ""}`,
    );
  }

  if (method.throws.length > 0) {
    md.paragraph("**Throws**");
    md.table(
      ["Error", "Description"],
      method.throws.map((t) => [t.type ? `\`${t.type}\`` : "—", t.description]),
    );
  }

  renderCalledBy(md, method.calledBy, selfLayerName, layerNames);

  if (method.businessRules.length > 0) {
    md.paragraph("**Business Rules**");
    md.list(method.businessRules);
  }
}

function renderMethodSignature(
  md: MarkdownBuilder,
  method: MethodSignatureInfo,
  headingLevel: number = 4,
): void {
  md.heading(headingLevel, `\`${method.signature}\``);

  if (method.description) {
    md.paragraph(method.description);
  }

  if (method.parameters.length > 0) {
    md.table(
      ["Parameter", "Type", "Description"],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `**Returns**: \`${sanitizeTableType(method.returnType)}\` ${method.returnDescription || ""}`,
    );
  }
}

async function renderMethodSequenceDiagram(
  md: MarkdownBuilder,
  className: string,
  methodName: string,
  callChains: CallChainEntry[],
  renderer: DiagramRenderer,
): Promise<void> {
  const chain = callChains.find((c) => c.className === className);
  if (!chain) return;

  const methodChain = chain.methods.find((m) => m.methodName === methodName);
  if (!methodChain || methodChain.calls.length === 0) return;

  const singleMethodChain: CallChainEntry = {
    ...chain,
    methods: [methodChain],
  };

  const diagram = await renderer.renderSequenceDiagram(singleMethodChain);
  if (diagram) {
    md.rawBlock(diagram);
  }
}

async function renderFunctionSequenceDiagram(
  md: MarkdownBuilder,
  funcName: string,
  callChains: CallChainEntry[],
  renderer: DiagramRenderer,
): Promise<void> {
  const chain = callChains.find((c) => c.className === funcName);
  if (!chain || chain.methods.length === 0) return;

  const diagram = await renderer.renderSequenceDiagram(chain);
  if (diagram) {
    md.rawBlock(diagram);
  }
}

function renderTypeAlias(
  md: MarkdownBuilder,
  ta: TypeAliasInfo,
  headingLevel: number = 3,
): void {
  md.heading(headingLevel, `${kindEmoji("type")} ${formatName(ta.name, "type", ta.category)}`);

  md.blockquote(
    [
      `**File**: \`${getFilename(ta.filePath)}\``,
      `**Type**: ${ta.category}`,
    ].join("\n"),
  );

  if (ta.description) {
    md.paragraph(ta.description);
  }

  md.codeBlock(ta.typeText, "typescript");

  if (ta.properties.length > 0) {
    md.paragraph("**Properties**");
    md.table(
      ["Property", "Type", "Required", "Description"],
      ta.properties.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }
}

function renderEnum(
  md: MarkdownBuilder,
  en: EnumInfo,
  headingLevel: number = 3,
): void {
  md.heading(headingLevel, `${kindEmoji("enum")} ${formatName(en.name, "enum", en.category)}`);

  md.blockquote(
    [
      `**File**: \`${getFilename(en.filePath)}\``,
      `**Type**: ${en.category}`,
    ].join("\n"),
  );

  if (en.description) {
    md.paragraph(en.description);
  }

  if (en.members.length > 0) {
    md.paragraph("**Members**");
    md.table(
      ["Name", "Value", "Description"],
      en.members.map((m) => [
        `\`${m.name}\``,
        m.value ? `\`${m.value}\`` : "—",
        m.description || "—",
      ]),
    );
  }
}

function renderConst(
  md: MarkdownBuilder,
  c: ConstInfo,
  headingLevel: number = 3,
): void {
  md.heading(headingLevel, `${kindEmoji("const")} ${formatName(c.name, "const", c.category)}`);

  md.blockquote(
    [
      `**File**: \`${getFilename(c.filePath)}\``,
      `**Type**: ${c.category}`,
    ].join("\n"),
  );

  if (c.description) {
    md.paragraph(c.description);
  }

  md.paragraph(`**Type**: \`${sanitizeTableType(c.type)}\``);

  if (c.valuePreview) {
    md.codeBlock(c.valuePreview, "typescript");
  }
}

function getFilename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}

/**
 * 直接呼び出しが期待される依存方向に反しているか確認する。
 * 設定のレイヤー順序は内側 → 外側（例: Domain, Application, Infrastructure, Presentation）。
 * 内側レイヤーから外側レイヤーへの直接呼び出しの場合にtrueを返す。
 * @param callerLayerName - 呼び出し元レイヤー名
 * @param targetLayerName - 呼び出し先レイヤー名
 * @param layerNames - 全レイヤー名の順序配列
 * @returns 内側から外側への呼び出しの場合はtrue
 */
function isInwardToOutwardCall(
  callerLayerName: string | undefined,
  targetLayerName: string | undefined,
  layerNames: string[] | undefined,
): boolean {
  if (!callerLayerName || !targetLayerName || !layerNames) return false;
  if (callerLayerName === targetLayerName) return false;
  const callerIdx = layerNames.indexOf(callerLayerName);
  const targetIdx = layerNames.indexOf(targetLayerName);
  if (callerIdx === -1 || targetIdx === -1) return false;
  return callerIdx < targetIdx;
}

/**
 * Markdownテーブルで安全にレンダリングするため `|` を `or` に置換する。
 * @param type - 型文字列
 * @returns サニタイズ済みの型文字列
 */
function sanitizeTableType(type: string): string {
  return type.replace(/\s*\|\s*/g, " or ");
}
