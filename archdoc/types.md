---
title: Types — 型定義層 API仕様
description: 共通型定義の提供
---

# Types — 型定義層 API仕様

## 責務と制約

| 項目 | 詳細 |
| --- | --- |
| **パス** | `src/types/` |
| **責務** | 共通型定義の提供 |
| **禁止インポート** | `src/cli`, `src/config`, `src/diagram`, `src/drift`, `src/extractor`, `src/generator` |

プロジェクト全体で共有される型定義。
設定ファイル構造と抽出結果の型を定義。

![Types Class Diagram](diagrams/types-class.svg)

## Typesのコンポーネント

![Class Diagram](diagrams/detail-1.svg)

### 📋 `CategoryOverride` インターフェース

> **ファイル**: `config.ts`
> **型**: Other

パターンベースのカテゴリ上書き設定。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `pattern` | `string` | ✓ | — |
| `category` | `string` | ✓ | — |

### 📋 `LayerConfig` インターフェース

> **ファイル**: `config.ts`
> **型**: Other

単一アーキテクチャレイヤーの設定。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `nameJa` | `string` | ✓ | — |
| `path` | `string` | ✓ | — |
| `type` | `LayerType` | ✓ | — |
| `description` | `string` | ✓ | — |
| `responsibility` | `string` | ✓ | — |
| `forbiddenImports` | `string[]` | ✓ | — |
| `categories` | `Record<string, string>` | ✓ | — |
| `dependsOn` | `string[] or undefined` | — | 許可する依存先レイヤー名。省略時はtypeから推論される。 |
| `categoryOverrides` | `CategoryOverride[] or undefined` | — | ディレクトリベースの解決後に適用される名前パターンベースのカテゴリ上書き。 |
| `framework` | `string or undefined` | — | フレームワーク固有の抽出に使用するフレームワーク識別子（例: "express"）。 |

### 📋 `ProjectConfig` インターフェース

> **ファイル**: `config.ts`
> **型**: Other

layers.yamlから読み込まれるプロジェクト設定。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `project` | `{ name: string; description: string; sourceRoot: string; locale?: "en" or "ja"; }` | ✓ | — |
| `layers` | `LayerConfig[]` | ✓ | — |

### 📋 `SpecDiff` インターフェース

> **ファイル**: `drift.ts`
> **型**: Other

2つの仕様スナップショット間で検出された単一の差分。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `entityName` | `string` | ✓ | — |
| `entityType` | `"function" or "class" or "interface"` | ✓ | — |
| `field` | `string` | ✓ | — |
| `severity` | `DriftSeverity` | ✓ | — |
| `designValue` | `string or undefined` | — | — |
| `implementationValue` | `string or undefined` | — | — |
| `description` | `string` | ✓ | — |

### 📋 `DriftResult` インターフェース

> **ファイル**: `drift.ts`
> **型**: Other

レイヤーのドリフト検出結果。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `layerName` | `string` | ✓ | — |
| `diffs` | `SpecDiff[]` | ✓ | — |
| `hasDrift` | `boolean` | ✓ | — |

### 📋 `DddWarning` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

DDD設計原則に反する構造を検出した警告。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `componentName` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `role` | `DddRole` | ✓ | — |
| `warningType` | `DddWarningType` | ✓ | — |
| `propertyName` | `string` | ✓ | — |

### 📋 `PropertyInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

クラスまたはインターフェースから抽出されたプロパティ情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `type` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `isReadonly` | `boolean` | ✓ | — |
| `isOptional` | `boolean` | ✓ | — |
| `visibility` | `"public" or "protected" or "private"` | ✓ | — |

### 📋 `ParameterInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

関数またはメソッドから抽出された引数情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `type` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `isOptional` | `boolean` | ✓ | — |
| `defaultValue` | `string or undefined` | — | — |

### 📋 `ThrowInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

JSDoc

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `type` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |

### 📋 `CallerReference` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

このメソッドまたは関数を呼び出しているコンポーネントの参照情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `callerName` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `layerName` | `string or undefined` | — | — |
| `callType` | `"interface" or "direct" or undefined` | — | — |
| `interfaceName` | `string or undefined` | — | — |

### 📋 `MethodInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

シグネチャ・引数・ビジネスルールを含むメソッド情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `signature` | `string` | ✓ | — |
| `parameters` | `ParameterInfo[]` | ✓ | — |
| `returnType` | `string` | ✓ | — |
| `returnDescription` | `string` | ✓ | — |
| `throws` | `ThrowInfo[]` | ✓ | — |
| `businessRules` | `string[]` | ✓ | — |
| `visibility` | `"public" or "protected" or "private"` | ✓ | — |
| `calledBy` | `CallerReference[] or undefined` | — | — |

### 📋 `MethodSignatureInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

インターフェース宣言から抽出されたメソッドシグネチャ。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `signature` | `string` | ✓ | — |
| `parameters` | `ParameterInfo[]` | ✓ | — |
| `returnType` | `string` | ✓ | — |
| `returnDescription` | `string` | ✓ | — |

### 📋 `DependencyInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

レイヤー間のインポート依存関係（禁止インポート検出含む）。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `source` | `string` | ✓ | — |
| `target` | `string` | ✓ | — |
| `type` | `"import" or "see"` | ✓ | — |
| `sourceFile` | `string or undefined` | — | — |
| `importPath` | `string or undefined` | — | — |
| `isForbidden` | `boolean or undefined` | — | — |

### 📋 `ClassInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

プロパティ・メソッド・依存関係を含むクラス情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `category` | `string` | ✓ | — |
| `subDirectory` | `string` | ✓ | — |
| `properties` | `PropertyInfo[]` | ✓ | — |
| `methods` | `MethodInfo[]` | ✓ | — |
| `businessRules` | `string[]` | ✓ | — |
| `dependencies` | `DependencyInfo[]` | ✓ | — |
| `isExported` | `boolean` | ✓ | — |
| `extendsClass` | `string or undefined` | — | — |
| `implementsInterfaces` | `string[]` | ✓ | — |
| `dddRole` | `DddRole or undefined` | — | — |

### 📋 `InterfaceInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

プロパティ・メソッドシグネチャを含むインターフェース情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `category` | `string` | ✓ | — |
| `subDirectory` | `string` | ✓ | — |
| `properties` | `PropertyInfo[]` | ✓ | — |
| `methods` | `MethodSignatureInfo[]` | ✓ | — |
| `isExported` | `boolean` | ✓ | — |
| `extendsInterfaces` | `string[]` | ✓ | — |
| `dddRole` | `DddRole or undefined` | — | — |

### 📋 `RouteCallInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

Expressルートハンドラ内のメソッド呼び出し。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `target` | `string` | ✓ | — |
| `method` | `string` | ✓ | — |

### 📋 `RouteJSDocTag` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

Expressルートハンドラから抽出されたJSDocタグ。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `tag` | `string` | ✓ | — |
| `name` | `string or undefined` | — | — |
| `description` | `string` | ✓ | — |

### 📋 `RouteInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

ミドルウェアとコールチェーンを含むExpressルート定義。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `method` | `string` | ✓ | — |
| `path` | `string` | ✓ | — |
| `middlewares` | `string[]` | ✓ | — |
| `description` | `string or undefined` | — | — |
| `jsdocTags` | `RouteJSDocTag[] or undefined` | — | — |
| `calls` | `RouteCallInfo[]` | ✓ | — |

### 📋 `FunctionInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

シグネチャ・引数・ルート情報を含む関数情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `category` | `string` | ✓ | — |
| `subDirectory` | `string` | ✓ | — |
| `signature` | `string` | ✓ | — |
| `parameters` | `ParameterInfo[]` | ✓ | — |
| `returnType` | `string` | ✓ | — |
| `returnDescription` | `string` | ✓ | — |
| `throws` | `ThrowInfo[]` | ✓ | — |
| `businessRules` | `string[]` | ✓ | — |
| `isExported` | `boolean` | ✓ | — |
| `calledBy` | `CallerReference[] or undefined` | — | — |
| `routes` | `RouteInfo[] or undefined` | — | — |

### 📋 `TypeAliasInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

型エイリアスの抽出情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `category` | `string` | ✓ | — |
| `subDirectory` | `string` | ✓ | — |
| `typeText` | `string` | ✓ | — |
| `properties` | `PropertyInfo[]` | ✓ | — |
| `isExported` | `boolean` | ✓ | — |

### 📋 `EnumMemberInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

enum宣言の個別メンバー情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `value` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |

### 📋 `EnumInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

enum宣言の抽出情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `category` | `string` | ✓ | — |
| `subDirectory` | `string` | ✓ | — |
| `members` | `EnumMemberInfo[]` | ✓ | — |
| `isExported` | `boolean` | ✓ | — |

### 📋 `ConstInfo` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

エクスポートされた定数の抽出情報。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `description` | `string` | ✓ | — |
| `category` | `string` | ✓ | — |
| `subDirectory` | `string` | ✓ | — |
| `type` | `string` | ✓ | — |
| `valuePreview` | `string` | ✓ | — |
| `isExported` | `boolean` | ✓ | — |

### 📋 `ConstructorDep` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

コールチェーン解析用のコンストラクタ依存パラメータ。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `paramName` | `string` | ✓ | — |
| `typeName` | `string` | ✓ | — |

### 📋 `MethodCall` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

クラスメソッドまたは関数内での依存先への単一メソッド呼び出し。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `target` | `string` | ✓ | — |
| `method` | `string` | ✓ | — |

### 📋 `MethodCallChain` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

単一メソッド内のすべての依存先呼び出し。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `methodName` | `string` | ✓ | — |
| `calls` | `MethodCall[]` | ✓ | — |

### 📋 `ClassCallChain` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

クラスまたは関数の完全なコールチェーン（依存先とメソッド呼び出しを含む）。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `className` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `constructorDeps` | `ConstructorDep[]` | ✓ | — |
| `methods` | `MethodCallChain[]` | ✓ | — |

### 📋 `CallChainEntry` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

LayerExtractionに格納されるシリアライズ可能なコールチェーンエントリ。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `className` | `string` | ✓ | — |
| `filePath` | `string` | ✓ | — |
| `constructorDeps` | `{ paramName: string; typeName: string; }[]` | ✓ | — |
| `methods` | `{ methodName: string; calls: { target: string; method: string; }[]; }[]` | ✓ | — |

### 📋 `LayerExtraction` インターフェース

> **ファイル**: `extracted.ts`
> **型**: Other

単一アーキテクチャレイヤーの完全な抽出結果。

**プロパティ**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `layerName` | `string` | ✓ | — |
| `classes` | `ClassInfo[]` | ✓ | — |
| `interfaces` | `InterfaceInfo[]` | ✓ | — |
| `functions` | `FunctionInfo[]` | ✓ | — |
| `typeAliases` | `TypeAliasInfo[]` | ✓ | — |
| `enums` | `EnumInfo[]` | ✓ | — |
| `constants` | `ConstInfo[]` | ✓ | — |
| `dependencies` | `DependencyInfo[]` | ✓ | — |
| `callChains` | `CallChainEntry[]` | ✓ | — |
| `dddWarnings` | `DddWarning[]` | ✓ | — |

### 📝 `LayerType` 型エイリアス

> **ファイル**: `config.ts`
> **型**: Other

DDDアーキテクチャで使用するレイヤー種別。

```typescript
"domain" | "application" | "presentation" | "infrastructure" | "custom"
```

### 📝 `DriftSeverity` 型エイリアス

> **ファイル**: `drift.ts`
> **型**: Other

仕様ドリフト検出の重大度レベル。

```typescript
"added" | "removed" | "changed"
```

### 📝 `DddRole` 型エイリアス

> **ファイル**: `extracted.ts`
> **型**: Other

DDDにおけるドメインモデルの役割分類。

```typescript
"entity" | "valueObject" | "domainService" | "repository" | "domainError"
```

### 📝 `DddWarningType` 型エイリアス

> **ファイル**: `extracted.ts`
> **型**: Other

DDD構造警告の種別。

```typescript
"mutableEntityId" | "mutableValueObjectProperty" | "statefulDomainService"
```
