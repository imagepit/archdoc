---
title: Cli — CLI層 API Spec
description: CLIインターフェースの提供
---

# Cli — CLI層 API Spec

## Responsibilities & Constraints

| Item | Detail |
| --- | --- |
| **Path** | `src/cli/` |
| **Responsibility** | CLIインターフェースの提供 |
| **Forbidden Imports** | — |

CLIコマンドの定義とエントリポイント。
init / generate / drift サブコマンドの実装。

## Other

### 🔧 `createProgram`

> **File**: `index.ts`

```ts
createProgram(): Command
```

**Returns**: `Command` 

## Command

### 🔧 `registerDiagramCommand`

> **File**: `diagram.ts`

```ts
registerDiagramCommand(program: Command): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `program` | `Command` | — |

**Called By**

- `createProgram()` — Cli (`index.ts`)

### 🔧 `registerDriftCommand`

> **File**: `drift.ts`

```ts
registerDriftCommand(program: Command): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `program` | `Command` | — |

**Called By**

- `createProgram()` — Cli (`index.ts`)

### 🔧 `registerGenerateCommand`

> **File**: `generate.ts`

```ts
registerGenerateCommand(program: Command): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `program` | `Command` | — |

**Called By**

- `createProgram()` — Cli (`index.ts`)

### 🔧 `registerInitCommand`

> **File**: `init.ts`

```ts
registerInitCommand(program: Command): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `program` | `Command` | — |

**Called By**

- `createProgram()` — Cli (`index.ts`)
