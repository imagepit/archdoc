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

```mermaid
sequenceDiagram
  participant Client
  participant registerDiagramCommand
  participant Command
  Client->>+registerDiagramCommand: registerDiagramCommand()
  registerDiagramCommand->>+Command: command()
  Command-->>-registerDiagramCommand: result
  registerDiagramCommand-->>-Client: response
```

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

```mermaid
sequenceDiagram
  participant Client
  participant registerDriftCommand
  participant Command
  Client->>+registerDriftCommand: registerDriftCommand()
  registerDriftCommand->>+Command: command()
  Command-->>-registerDriftCommand: result
  registerDriftCommand-->>-Client: response
```

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

```mermaid
sequenceDiagram
  participant Client
  participant registerGenerateCommand
  participant Command
  Client->>+registerGenerateCommand: registerGenerateCommand()
  registerGenerateCommand->>+Command: command()
  Command-->>-registerGenerateCommand: result
  registerGenerateCommand-->>-Client: response
```

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

```mermaid
sequenceDiagram
  participant Client
  participant registerInitCommand
  participant Command
  Client->>+registerInitCommand: registerInitCommand()
  registerInitCommand->>+Command: command()
  Command-->>-registerInitCommand: result
  registerInitCommand-->>-Client: response
```
