/** Markdownドキュメントをプログラマティックに構築するFluentビルダー。 */
export class MarkdownBuilder {
  private lines: string[] = [];

  /**
   * YAMLフロントマターブロックを追加する。
   * @param data - フロントマターのキー/値ペア
   * @returns thisを返すメソッドチェーン用
   */
  frontmatter(data: Record<string, string>): this {
    this.lines.push("---");
    for (const [key, value] of Object.entries(data)) {
      this.lines.push(`${key}: ${value}`);
    }
    this.lines.push("---");
    this.lines.push("");
    return this;
  }

  /**
   * 指定レベルの見出しを追加する。
   * @param level - 見出しレベル（1〜6）
   * @param text - 見出しテキスト
   * @returns thisを返すメソッドチェーン用
   */
  heading(level: number, text: string): this {
    this.lines.push(`${"#".repeat(level)} ${text}`);
    this.lines.push("");
    return this;
  }

  /**
   * 段落テキストを追加する。
   * @param text - 段落テキスト
   * @returns thisを返すメソッドチェーン用
   */
  paragraph(text: string): this {
    this.lines.push(text);
    this.lines.push("");
    return this;
  }

  /**
   * 引用ブロックを追加する。
   * @param text - 引用テキスト（複数行可）
   * @returns thisを返すメソッドチェーン用
   */
  blockquote(text: string): this {
    const lines = text.split("\n").map((l) => `> ${l}`);
    this.lines.push(...lines);
    this.lines.push("");
    return this;
  }

  /**
   * Markdownテーブルを追加する。
   * @param headers - ヘッダー文字列配列
   * @param rows - データ行の二次元配列
   * @returns thisを返すメソッドチェーン用
   */
  table(headers: string[], rows: string[][]): this {
    if (rows.length === 0) return this;

    const esc = (cell: string) => cell.replace(/\|/g, "\\|");
    const headerRow = `| ${headers.map(esc).join(" | ")} |`;
    const separator = `| ${headers.map(() => "---").join(" | ")} |`;
    const dataRows = rows.map((row) => `| ${row.map(esc).join(" | ")} |`);

    this.lines.push(headerRow);
    this.lines.push(separator);
    this.lines.push(...dataRows);
    this.lines.push("");
    return this;
  }

  /**
   * コードブロックを追加する。
   * @param code - コード文字列
   * @param lang - 言語識別子（デフォルト: "ts"）
   * @returns thisを返すメソッドチェーン用
   */
  codeBlock(code: string, lang: string = "ts"): this {
    this.lines.push(`\`\`\`${lang}`);
    this.lines.push(code);
    this.lines.push("```");
    this.lines.push("");
    return this;
  }

  /**
   * 箇条書きリストを追加する。
   * @param items - リスト項目の文字列配列
   * @returns thisを返すメソッドチェーン用
   */
  list(items: string[]): this {
    for (const item of items) {
      this.lines.push(`- ${item}`);
    }
    this.lines.push("");
    return this;
  }

  /**
   * テキストをそのままドキュメントに追加する（末尾改行なし）。
   * @param text - 追加するテキスト
   * @returns thisを返すメソッドチェーン用
   */
  raw(text: string): this {
    this.lines.push(text);
    return this;
  }

  /**
   * テキストをブロックとしてドキュメントに追加する（末尾に空行を追加）。
   * @param text - 追加するテキスト
   * @returns thisを返すメソッドチェーン用
   */
  rawBlock(text: string): this {
    this.lines.push(text);
    this.lines.push("");
    return this;
  }

  /**
   * 蓄積したすべての行を結合してMarkdown文字列を返す。
   * @returns 完成したMarkdown文字列
   */
  build(): string {
    return this.lines.join("\n");
  }
}
