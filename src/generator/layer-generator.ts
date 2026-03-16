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
  DddRole,
} from "../types/extracted.js";
import type { CallChainEntry } from "../types/extracted.js";
import type { DiagramRenderer } from "../diagram/diagram-renderer.js";
import type { LocaleMessages } from "../i18n/types.js";
import { getMessages } from "../i18n/index.js";
import { formatName, kindEmoji, type ObjectKind } from "./emoji.js";
import { relative, dirname } from "node:path";

/** ダイアグラムレンダラーを含むレイヤードキュメント生成オプション。 */
export interface GenerateOptions {
  renderer: DiagramRenderer;
  /** 依存方向チェック用のレイヤー名順序配列（内側 → 外側） */
  layerNames?: string[];
  /** ロケールメッセージ（省略時は英語） */
  messages?: LocaleMessages;
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
  const t = options.messages ?? getMessages("en");
  const selfLayerName = layer.name;

  md.frontmatter({
    title: `${layer.name} — ${layer.nameJa} ${t.layer.apiSpec}`,
    description: layer.responsibility,
  });

  md.heading(1, `${layer.name} — ${layer.nameJa} ${t.layer.apiSpec}`);

  md.heading(2, t.layer.responsibilitiesAndConstraints);

  md.table(
    [t.index.headerItem, t.index.headerDetail],
    [
      [t.layer.labelPath, `\`${layer.path}/\``],
      [t.layer.labelResponsibility, layer.responsibility],
      [
        t.layer.labelForbiddenImports,
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

  const dirGroups = groupByDirectory(extraction, layer.path);

  for (const [relDir, items] of dirGroups) {
    md.heading(2, formatDirectoryHeading(layer.name, relDir, t));

    await renderGroupDiagramAndItems(
      md,
      items,
      extraction.callChains,
      renderer,
      3,
      t,
      selfLayerName,
      layerNames,
    );
  }

  return md.build();
}

interface CategorizedItem {
  kind: ObjectKind;
  data: ClassInfo | InterfaceInfo | FunctionInfo | TypeAliasInfo | EnumInfo | ConstInfo;
}

/**
 * ファイルの相対ディレクトリパスでアイテムをグループ化する。
 * @param extraction - レイヤーの抽出結果
 * @param layerPath - レイヤーの設定パス
 * @returns 相対ディレクトリをキーとするアイテムのMap
 */
function groupByDirectory(
  extraction: LayerExtraction,
  layerPath: string,
): Map<string, CategorizedItem[]> {
  const map = new Map<string, CategorizedItem[]>();
  const seen = new Set<string>();

  const addItem = (kind: ObjectKind, data: { name: string; filePath: string }) => {
    const key = `${kind}:${data.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    const dir = getRelativeDir(data.filePath, layerPath);
    const items = map.get(dir) ?? [];
    items.push({ kind, data: data as CategorizedItem["data"] });
    map.set(dir, items);
  };

  for (const cls of extraction.classes) addItem("class", cls);
  for (const iface of extraction.interfaces) addItem("interface", iface);
  for (const func of extraction.functions) addItem("function", func);
  for (const ta of extraction.typeAliases) addItem("type", ta);
  for (const en of extraction.enums) addItem("enum", en);
  for (const c of extraction.constants) addItem("const", c);

  return map;
}

/**
 * ファイルの絶対パスからレイヤーパスを基準とした相対ディレクトリを取得する。
 * @param filePath - ファイルの絶対パス
 * @param layerPath - レイヤーの設定パス
 * @returns 相対ディレクトリパス（ルート直下の場合は空文字列）
 */
function getRelativeDir(filePath: string, layerPath: string): string {
  const relPath = relative(layerPath, filePath);
  const dir = dirname(relPath);
  return dir === "." ? "" : dir;
}

/**
 * レイヤー名とディレクトリパスからセクション見出しを生成する。
 * @param layerName - レイヤー名
 * @param relDir - 相対ディレクトリパス
 * @param t - ロケールメッセージ
 * @returns 見出し文字列（例: "Extractor/Framework のコンポーネント"）
 */
function formatDirectoryHeading(layerName: string, relDir: string, t: LocaleMessages): string {
  if (!relDir) {
    return `${layerName}${t.layer.componentsSuffix}`;
  }
  const formattedDir = relDir
    .split("/")
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("/");
  return `${layerName}/${formattedDir}${t.layer.componentsSuffix}`;
}

/**
 * グループのクラス図と個別アイテムをレンダリングする。
 * @param md - Markdownビルダー
 * @param items - レンダリング対象のアイテム配列
 * @param callChains - コールチェーンエントリ配列
 * @param renderer - ダイアグラムレンダラー
 * @param headingLevel - 見出しレベル
 * @param t - ロケールメッセージ
 * @param selfLayerName - 自レイヤー名（省略可）
 * @param layerNames - 全レイヤー名の順序配列（省略可）
 */
async function renderGroupDiagramAndItems(
  md: MarkdownBuilder,
  items: CategorizedItem[],
  callChains: CallChainEntry[],
  renderer: DiagramRenderer,
  headingLevel: number,
  t: LocaleMessages,
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
        await renderClass(md, item.data as ClassInfo, headingLevel, t, selfLayerName, layerNames, callChains, renderer);
        break;
      case "interface":
        renderInterface(md, item.data as InterfaceInfo, headingLevel, t);
        break;
      case "function":
        await renderFunction(md, item.data as FunctionInfo, headingLevel, t, selfLayerName, layerNames, callChains, renderer);
        break;
      case "type":
        renderTypeAlias(md, item.data as TypeAliasInfo, headingLevel, t);
        break;
      case "enum":
        renderEnum(md, item.data as EnumInfo, headingLevel, t);
        break;
      case "const":
        renderConst(md, item.data as ConstInfo, headingLevel, t);
        break;
    }
  }
}

async function renderClass(
  md: MarkdownBuilder,
  cls: ClassInfo,
  headingLevel: number,
  t: LocaleMessages,
  selfLayerName?: string,
  layerNames?: string[],
  callChains?: CallChainEntry[],
  renderer?: DiagramRenderer,
): Promise<void> {
  md.heading(headingLevel, `${kindEmoji("class")} ${formatName(cls.name, "class", cls.category)} ${t.layer.kindSuffix.class}${formatDddRoleSuffix(cls.dddRole, t)}`);

  md.blockquote(
    [
      `${t.layer.labelFile}: \`${getFilename(cls.filePath)}\``,
      `${t.layer.labelType}: ${cls.category}`,
    ].join("\n"),
  );

  renderDddWarnings(md, cls, t);

  if (cls.description) {
    md.paragraph(cls.description);
  }

  if (cls.businessRules.length > 0) {
    md.paragraph(t.layer.labelBusinessRules);
    md.list(cls.businessRules);
  }

  if (cls.properties.length > 0) {
    md.paragraph(t.layer.labelProperties);
    md.table(
      [t.layer.headerProperty, t.layer.headerType, t.layer.headerRequired, t.layer.headerDescription],
      cls.properties.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (cls.methods.length > 0) {
    md.paragraph(t.layer.labelMethods);
    for (const method of cls.methods) {
      renderMethod(md, method, headingLevel + 1, t, selfLayerName, layerNames);
      if (callChains && renderer) {
        await renderMethodSequenceDiagram(md, cls.name, method.name, callChains, renderer);
      }
    }
  }
}

function renderInterface(
  md: MarkdownBuilder,
  iface: InterfaceInfo,
  headingLevel: number,
  t: LocaleMessages,
): void {
  md.heading(headingLevel, `${kindEmoji("interface")} ${formatName(iface.name, "interface", iface.category)} ${t.layer.kindSuffix.interface}${formatDddRoleSuffix(iface.dddRole, t)}`);

  md.blockquote(
    [
      `${t.layer.labelFile}: \`${getFilename(iface.filePath)}\``,
      `${t.layer.labelType}: ${iface.category}`,
    ].join("\n"),
  );

  if (iface.description) {
    md.paragraph(iface.description);
  }

  if (iface.properties.length > 0) {
    md.paragraph(t.layer.labelProperties);
    md.table(
      [t.layer.headerProperty, t.layer.headerType, t.layer.headerRequired, t.layer.headerDescription],
      iface.properties.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.isOptional ? "—" : "✓",
        p.description || "—",
      ]),
    );
  }

  if (iface.methods.length > 0) {
    md.paragraph(t.layer.labelMethods);
    for (const method of iface.methods) {
      renderMethodSignature(md, method, headingLevel + 1, t);
    }
  }
}

async function renderFunction(
  md: MarkdownBuilder,
  func: FunctionInfo,
  headingLevel: number,
  t: LocaleMessages,
  selfLayerName?: string,
  layerNames?: string[],
  callChains?: CallChainEntry[],
  renderer?: DiagramRenderer,
): Promise<void> {
  md.heading(headingLevel, `${kindEmoji("function")} ${formatName(func.name, "function", func.category)} ${t.layer.kindSuffix.function}`);

  md.blockquote(`${t.layer.labelFile}: \`${getFilename(func.filePath)}\``);

  if (func.description) {
    md.paragraph(func.description);
  }

  md.codeBlock(func.signature);

  if (func.parameters.length > 0) {
    md.table(
      [t.layer.headerParameter, t.layer.headerType, t.layer.headerDescription],
      func.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (func.returnType && func.returnType !== "void") {
    md.paragraph(`${t.layer.labelReturns}: \`${func.returnType}\` ${func.returnDescription || ""}`);
  }

  if (func.throws.length > 0) {
    md.paragraph(t.layer.labelThrows);
    md.table(
      [t.layer.headerError, t.layer.headerDescription],
      func.throws.map((th) => [th.type ? `\`${th.type}\`` : "—", th.description]),
    );
  }

  renderCalledBy(md, t, func.calledBy, selfLayerName, layerNames);

  if (func.businessRules.length > 0) {
    md.paragraph(t.layer.labelBusinessRules);
    md.list(func.businessRules);
  }

  if (callChains && renderer) {
    await renderFunctionSequenceDiagram(md, func.name, callChains, renderer);
  }

  if (func.routes && func.routes.length > 0 && renderer) {
    md.paragraph(t.layer.labelRoutes);
    md.table(
      [t.layer.headerMethod, t.layer.headerPath, t.layer.headerMiddleware],
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
        md.paragraph(`${t.layer.labelMiddleware}: ${route.middlewares.map((m) => `\`${m}\``).join(", ")}`);
      }
      if (route.description) {
        md.paragraph(route.description);
      }
      if (route.jsdocTags && route.jsdocTags.length > 0) {
        const params = route.jsdocTags.filter((tg) => tg.tag === "param");
        const returns = route.jsdocTags.filter((tg) => tg.tag === "returns");
        const throws = route.jsdocTags.filter((tg) => tg.tag === "throws");
        if (params.length > 0) {
          md.table(
            [t.layer.headerParameter, t.layer.headerDescription],
            params.map((p) => [`\`${p.name}\``, p.description]),
          );
        }
        if (returns.length > 0) {
          md.paragraph(`${t.layer.labelReturns}: ${returns.map((r) => r.description).join(", ")}`);
        }
        if (throws.length > 0) {
          md.paragraph(`${t.layer.labelThrows}: ${throws.map((th) => th.description).join(", ")}`);
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
  t: LocaleMessages,
  calledBy?: CallerReference[],
  selfLayerName?: string,
  layerNames?: string[],
): void {
  if (!calledBy || calledBy.length === 0) return;
  md.paragraph(t.layer.labelCalledBy);
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
  headingLevel: number,
  t: LocaleMessages,
  selfLayerName?: string,
  layerNames?: string[],
): void {
  md.heading(headingLevel, `\`${method.name}\` ${t.layer.kindSuffix.method}`);

  if (method.description) {
    md.paragraph(method.description);
  }

  md.codeBlock(method.signature);

  if (method.parameters.length > 0) {
    md.table(
      [t.layer.headerParameter, t.layer.headerType, t.layer.headerDescription],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `${t.layer.labelReturns}: \`${sanitizeTableType(method.returnType)}\` ${method.returnDescription || ""}`,
    );
  }

  if (method.throws.length > 0) {
    md.paragraph(t.layer.labelThrows);
    md.table(
      [t.layer.headerError, t.layer.headerDescription],
      method.throws.map((th) => [th.type ? `\`${th.type}\`` : "—", th.description]),
    );
  }

  renderCalledBy(md, t, method.calledBy, selfLayerName, layerNames);

  if (method.businessRules.length > 0) {
    md.paragraph(t.layer.labelBusinessRules);
    md.list(method.businessRules);
  }
}

function renderMethodSignature(
  md: MarkdownBuilder,
  method: MethodSignatureInfo,
  headingLevel: number,
  t: LocaleMessages,
): void {
  md.heading(headingLevel, `\`${method.name}\` ${t.layer.kindSuffix.method}`);

  if (method.description) {
    md.paragraph(method.description);
  }

  md.codeBlock(method.signature);

  if (method.parameters.length > 0) {
    md.table(
      [t.layer.headerParameter, t.layer.headerType, t.layer.headerDescription],
      method.parameters.map((p) => [
        `\`${p.name}\``,
        `\`${sanitizeTableType(p.type)}\``,
        p.description || "—",
      ]),
    );
  }

  if (method.returnType && method.returnType !== "void") {
    md.paragraph(
      `${t.layer.labelReturns}: \`${sanitizeTableType(method.returnType)}\` ${method.returnDescription || ""}`,
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
  headingLevel: number,
  t: LocaleMessages,
): void {
  md.heading(headingLevel, `${kindEmoji("type")} ${formatName(ta.name, "type", ta.category)} ${t.layer.kindSuffix.type}`);

  md.blockquote(
    [
      `${t.layer.labelFile}: \`${getFilename(ta.filePath)}\``,
      `${t.layer.labelType}: ${ta.category}`,
    ].join("\n"),
  );

  if (ta.description) {
    md.paragraph(ta.description);
  }

  md.codeBlock(ta.typeText, "typescript");

  if (ta.properties.length > 0) {
    md.paragraph(t.layer.labelProperties);
    md.table(
      [t.layer.headerProperty, t.layer.headerType, t.layer.headerRequired, t.layer.headerDescription],
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
  headingLevel: number,
  t: LocaleMessages,
): void {
  md.heading(headingLevel, `${kindEmoji("enum")} ${formatName(en.name, "enum", en.category)} ${t.layer.kindSuffix.enum}`);

  md.blockquote(
    [
      `${t.layer.labelFile}: \`${getFilename(en.filePath)}\``,
      `${t.layer.labelType}: ${en.category}`,
    ].join("\n"),
  );

  if (en.description) {
    md.paragraph(en.description);
  }

  if (en.members.length > 0) {
    md.paragraph(t.layer.labelMembers);
    md.table(
      [t.layer.headerName, t.layer.headerValue, t.layer.headerDescription],
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
  headingLevel: number,
  t: LocaleMessages,
): void {
  md.heading(headingLevel, `${kindEmoji("const")} ${formatName(c.name, "const", c.category)} ${t.layer.kindSuffix.const}`);

  md.blockquote(
    [
      `${t.layer.labelFile}: \`${getFilename(c.filePath)}\``,
      `${t.layer.labelType}: ${c.category}`,
    ].join("\n"),
  );

  if (c.description) {
    md.paragraph(c.description);
  }

  md.paragraph(`${t.layer.labelType}: \`${sanitizeTableType(c.type)}\``);

  if (c.valuePreview) {
    md.codeBlock(c.valuePreview, "typescript");
  }
}

function formatDddRoleSuffix(dddRole: DddRole | undefined, t: LocaleMessages): string {
  if (!dddRole) return "";
  return ` (${t.ddd.roles[dddRole]})`;
}

function renderDddWarnings(md: MarkdownBuilder, cls: ClassInfo, t: LocaleMessages): void {
  if (!cls.dddRole) return;

  switch (cls.dddRole) {
    case "entity": {
      const idProp = cls.properties.find((p) => p.name === "id");
      if (idProp && !idProp.isReadonly) {
        md.blockquote(`⚠️ ${t.ddd.warnings.messages.mutableEntityId("id")}`);
      }
      break;
    }
    case "valueObject": {
      for (const prop of cls.properties) {
        if (!prop.isReadonly) {
          md.blockquote(`⚠️ ${t.ddd.warnings.messages.mutableValueObjectProperty(prop.name)}`);
        }
      }
      break;
    }
    case "domainService": {
      for (const prop of cls.properties) {
        if (!prop.isReadonly) {
          md.blockquote(`⚠️ ${t.ddd.warnings.messages.statefulDomainService(prop.name)}`);
        }
      }
      break;
    }
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
