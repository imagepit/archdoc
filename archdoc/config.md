---
title: Config — 設定層 API仕様
description: 設定ファイルの解析・バリデーション
---

# Config — 設定層 API仕様

## 責務と制約

| 項目 | 詳細 |
| --- | --- |
| **パス** | `src/config/` |
| **責務** | 設定ファイルの解析・バリデーション |
| **禁止インポート** | `src/cli`, `src/diagram`, `src/drift`, `src/extractor`, `src/generator` |

layers.yaml設定ファイルの読み込みとバリデーション。

## Other

### 🔧 `getDefaultCategories`

> **ファイル**: `defaults.ts`

指定されたレイヤー種別に対応するデフォルトカテゴリマッピングを返す。

```ts
getDefaultCategories(layerType: LayerType): Record<string, string>
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `layerType` | `LayerType` | レイヤー種別 |

**戻り値**: `Record<string, string>` カテゴリ名のマッピング

**呼び出し元**

- `loadConfig()` — Config (`loader.ts`)

### 🔧 `loadConfig`

> **ファイル**: `loader.ts`

layers.yamlファイルからプロジェクト設定を読み込みバリデーションする。

```ts
loadConfig(configPath?: string): ProjectConfig
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `configPath` | `string` | 設定ファイルのパス |

**戻り値**: `ProjectConfig` バリデーション済みのプロジェクト設定

**呼び出し元**

- `registerDiagramCommand()` — Cli (`diagram.ts`)
- `registerDriftCommand()` — Cli (`drift.ts`)
- `registerGenerateCommand()` — Cli (`generate.ts`)

### 📌 `projectConfigSchema`

> **ファイル**: `schema.ts`
> **型**: Other

layers.yamlプロジェクト設定のバリデーション用Zodスキーマ。

**型**: `z.ZodObject<{ project: z.ZodObject<{ name: z.ZodString; description: z.ZodDefault<z.ZodString>; sourceRoot: z.ZodDefault<z.ZodString>; locale: z.ZodDefault<z.ZodEnum<["en", "ja"]>>; }, "strip", z.ZodTypeAny, { name: string; description: string; sourceRoot: string; locale: "en" or "ja"; }, { name: string; description?: string or undefined; sourceRoot?: string or undefined; locale?: "en" or "ja" or undefined; }>; layers: z.ZodArray<z.ZodObject<{ name: z.ZodString; nameJa: z.ZodString; path: z.ZodString; type: z.ZodEnum<["domain", "application", "presentation", "infrastructure", "custom"]>; description: z.ZodDefault<z.ZodString>; responsibility: z.ZodDefault<z.ZodString>; forbiddenImports: z.ZodDefault<z.ZodArray<z.ZodString, "many">>; categories: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>; dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>; categoryOverrides: z.ZodOptional<z.ZodArray<z.ZodObject<{ pattern: z.ZodString; category: z.ZodString; }, "strip", z.ZodTypeAny, { pattern: string; category: string; }, { pattern: string; category: string; }>, "many">>; framework: z.ZodOptional<z.ZodString>; }, "strip", z.ZodTypeAny, { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; description: string; nameJa: string; responsibility: string; forbiddenImports: string[]; categories: Record<string, string>; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }, { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; nameJa: string; description?: string or undefined; responsibility?: string or undefined; forbiddenImports?: string[] or undefined; categories?: Record<string, string> or undefined; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }>, "many">; }, "strip", z.ZodTypeAny, { project: { name: string; description: string; sourceRoot: string; locale: "en" or "ja"; }; layers: { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; description: string; nameJa: string; responsibility: string; forbiddenImports: string[]; categories: Record<string, string>; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }[]; }, { project: { name: string; description?: string or undefined; sourceRoot?: string or undefined; locale?: "en" or "ja" or undefined; }; layers: { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; nameJa: string; description?: string or undefined; responsibility?: string or undefined; forbiddenImports?: string[] or undefined; categories?: Record<string, string> or undefined; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }[]; }>`

```typescript
z.object({
  project: z.object({
    name: z.string().min(1),
    description: …
```
