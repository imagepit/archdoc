export class MarkdownBuilder {
  private lines: string[] = [];

  frontmatter(data: Record<string, string>): this {
    this.lines.push("---");
    for (const [key, value] of Object.entries(data)) {
      this.lines.push(`${key}: ${value}`);
    }
    this.lines.push("---");
    this.lines.push("");
    return this;
  }

  heading(level: number, text: string): this {
    this.lines.push(`${"#".repeat(level)} ${text}`);
    this.lines.push("");
    return this;
  }

  paragraph(text: string): this {
    this.lines.push(text);
    this.lines.push("");
    return this;
  }

  blockquote(text: string): this {
    const lines = text.split("\n").map((l) => `> ${l}`);
    this.lines.push(...lines);
    this.lines.push("");
    return this;
  }

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

  codeBlock(code: string, lang: string = "ts"): this {
    this.lines.push(`\`\`\`${lang}`);
    this.lines.push(code);
    this.lines.push("```");
    this.lines.push("");
    return this;
  }

  list(items: string[]): this {
    for (const item of items) {
      this.lines.push(`- ${item}`);
    }
    this.lines.push("");
    return this;
  }

  raw(text: string): this {
    this.lines.push(text);
    return this;
  }

  rawBlock(text: string): this {
    this.lines.push(text);
    this.lines.push("");
    return this;
  }

  build(): string {
    return this.lines.join("\n");
  }
}
