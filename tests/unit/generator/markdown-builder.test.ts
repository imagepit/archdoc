import { describe, it, expect } from "vitest";
import { MarkdownBuilder } from "../../../src/generator/markdown-builder.js";

describe("MarkdownBuilder", () => {
  it("generates frontmatter", () => {
    const md = new MarkdownBuilder()
      .frontmatter({ title: "Test", description: "A test doc" })
      .build();

    expect(md).toContain("---\ntitle: Test\ndescription: A test doc\n---");
  });

  it("generates headings", () => {
    const md = new MarkdownBuilder()
      .heading(1, "Title")
      .heading(2, "Section")
      .heading(3, "Subsection")
      .build();

    expect(md).toContain("# Title");
    expect(md).toContain("## Section");
    expect(md).toContain("### Subsection");
  });

  it("generates GFM tables", () => {
    const md = new MarkdownBuilder()
      .table(["Name", "Type"], [["foo", "string"], ["bar", "number"]])
      .build();

    expect(md).toContain("| Name | Type |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| foo | string |");
    expect(md).toContain("| bar | number |");
  });

  it("generates code blocks", () => {
    const md = new MarkdownBuilder()
      .codeBlock("const x = 1;", "ts")
      .build();

    expect(md).toContain("```ts\nconst x = 1;\n```");
  });

  it("generates lists", () => {
    const md = new MarkdownBuilder()
      .list(["Item 1", "Item 2"])
      .build();

    expect(md).toContain("- Item 1\n- Item 2");
  });

  it("generates blockquotes", () => {
    const md = new MarkdownBuilder()
      .blockquote("A quote\nMultiple lines")
      .build();

    expect(md).toContain("> A quote\n> Multiple lines");
  });
});
