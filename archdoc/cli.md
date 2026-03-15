---
title: Cli — CLI層 API仕様
description: CLIインターフェースの提供
---

# Cli — CLI層 API仕様

## 責務と制約

| 項目 | 詳細 |
| --- | --- |
| **パス** | `src/cli/` |
| **責務** | CLIインターフェースの提供 |
| **禁止インポート** | — |

CLIコマンドの定義とエントリポイント。
init / generate / drift サブコマンドの実装。

## Other

### 🔧 `createProgram`

> **ファイル**: `index.ts`

全CLIサブコマンドを登録したCommander.jsプログラムを作成する。

```ts
createProgram(): Command
```

**戻り値**: `Command` 設定済みのCommanderプログラム

## Command

### 🔧 `registerDiagramCommand`

> **ファイル**: `diagram.ts`

単体ダイアグラム生成用の'diagram'サブコマンドを登録する。

```ts
registerDiagramCommand(program: Command): void
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `program` | `Command` | Commanderプログラム |

**呼び出し元**

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

> **ファイル**: `drift.ts`

仕様ドリフト検出用の'drift'サブコマンドを登録する。

```ts
registerDriftCommand(program: Command): void
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `program` | `Command` | Commanderプログラム |

**呼び出し元**

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

> **ファイル**: `generate.ts`

ドキュメント生成用の'generate'サブコマンドを登録する。

```ts
registerGenerateCommand(program: Command): void
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `program` | `Command` | Commanderプログラム |

**呼び出し元**

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

> **ファイル**: `init.ts`

layers.yaml初期化用の'init'サブコマンドを登録する。

```ts
registerInitCommand(program: Command): void
```

| 引数 | 型 | 説明 |
| --- | --- | --- |
| `program` | `Command` | Commanderプログラム |

**呼び出し元**

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
