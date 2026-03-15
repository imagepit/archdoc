---
title: Config — 設定層 API Spec
description: 設定ファイルの解析・バリデーション
---

# Config — 設定層 API Spec

## Responsibilities & Constraints

| Item | Detail |
| --- | --- |
| **Path** | `src/config/` |
| **Responsibility** | 設定ファイルの解析・バリデーション |
| **Forbidden Imports** | `src/cli`, `src/diagram`, `src/drift`, `src/extractor`, `src/generator` |

layers.yaml設定ファイルの読み込みとバリデーション。

## Other

### 🔧 `getDefaultCategories`

> **File**: `defaults.ts`

指定されたレイヤー種別に対応するデフォルトカテゴリマッピングを返す。

```ts
getDefaultCategories(layerType: LayerType): Record<string, string>
```

| Parameter | Type | Description |
| --- | --- | --- |
| `layerType` | `LayerType` | レイヤー種別 |

**Returns**: `Record<string, string>` カテゴリ名のマッピング

**Called By**

- `loadConfig()` — Config (`loader.ts`)

### 🔧 `loadConfig`

> **File**: `loader.ts`

layers.yamlファイルからプロジェクト設定を読み込みバリデーションする。

```ts
loadConfig(configPath?: string): ProjectConfig
```

| Parameter | Type | Description |
| --- | --- | --- |
| `configPath` | `string` | 設定ファイルのパス |

**Returns**: `ProjectConfig` バリデーション済みのプロジェクト設定

**Called By**

- `registerDiagramCommand()` — Cli (`diagram.ts`)
- `registerDriftCommand()` — Cli (`drift.ts`)
- `registerGenerateCommand()` — Cli (`generate.ts`)

### 📌 `projectConfigSchema`

> **File**: `schema.ts`
> **Type**: Other

layers.yamlプロジェクト設定のバリデーション用Zodスキーマ。

**Type**: `z.ZodObject<{ project: z.ZodObject<{ name: z.ZodString; description: z.ZodDefault<z.ZodString>; sourceRoot: z.ZodDefault<z.ZodString>; }, "strip", z.ZodTypeAny, { name: string; description: string; sourceRoot: string; }, { name: string; description?: string or undefined; sourceRoot?: string or undefined; }>; layers: z.ZodArray<z.ZodObject<{ name: z.ZodString; nameJa: z.ZodString; path: z.ZodString; type: z.ZodEnum<["domain", "application", "presentation", "infrastructure", "custom"]>; description: z.ZodDefault<z.ZodString>; responsibility: z.ZodDefault<z.ZodString>; forbiddenImports: z.ZodDefault<z.ZodArray<z.ZodString, "many">>; categories: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>; dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>; categoryOverrides: z.ZodOptional<z.ZodArray<z.ZodObject<{ pattern: z.ZodString; category: z.ZodString; }, "strip", z.ZodTypeAny, { pattern: string; category: string; }, { pattern: string; category: string; }>, "many">>; framework: z.ZodOptional<z.ZodString>; }, "strip", z.ZodTypeAny, { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; description: string; nameJa: string; responsibility: string; forbiddenImports: string[]; categories: Record<string, string>; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }, { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; nameJa: string; description?: string or undefined; responsibility?: string or undefined; forbiddenImports?: string[] or undefined; categories?: Record<string, string> or undefined; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }>, "many">; }, "strip", z.ZodTypeAny, { project: { name: string; description: string; sourceRoot: string; }; layers: { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; description: string; nameJa: string; responsibility: string; forbiddenImports: string[]; categories: Record<string, string>; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }[]; }, { project: { name: string; description?: string or undefined; sourceRoot?: string or undefined; }; layers: { path: string; type: "domain" or "application" or "presentation" or "infrastructure" or "custom"; name: string; nameJa: string; description?: string or undefined; responsibility?: string or undefined; forbiddenImports?: string[] or undefined; categories?: Record<string, string> or undefined; dependsOn?: string[] or undefined; categoryOverrides?: { pattern: string; category: string; }[] or undefined; framework?: string or undefined; }[]; }>`

```typescript
z.object({
  project: z.object({
    name: z.string().min(1),
    description: …
```
