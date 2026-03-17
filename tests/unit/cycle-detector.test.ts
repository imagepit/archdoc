import { describe, it, expect } from "vitest";
import { detectLayerCycles } from "../../src/analyzer/cycle-detector.js";
import type { LayerExtraction } from "../../src/types/extracted.js";

function makeExtraction(
  layerName: string,
  deps: { source: string; target: string; sourceFile?: string; importPath?: string }[],
): LayerExtraction {
  return {
    layerName,
    classes: [],
    interfaces: [],
    functions: [],
    typeAliases: [],
    enums: [],
    constants: [],
    dependencies: deps.map((d) => ({
      ...d,
      type: "import" as const,
    })),
    callChains: [],
    dddWarnings: [],
  };
}

describe("detectLayerCycles", () => {
  it("detects a simple A → B → A cycle", () => {
    const extractions = [
      makeExtraction("A", [
        { source: "A", target: "B", sourceFile: "/a/foo.ts", importPath: "../b/bar" },
      ]),
      makeExtraction("B", [
        { source: "B", target: "A", sourceFile: "/b/bar.ts", importPath: "../a/foo" },
      ]),
    ];

    const cycles = detectLayerCycles(extractions);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].cycle).toEqual(["A", "B", "A"]);
    expect(cycles[0].edges).toHaveLength(2);
  });

  it("detects a three-node cycle A → B → C → A", () => {
    const extractions = [
      makeExtraction("A", [{ source: "A", target: "B" }]),
      makeExtraction("B", [{ source: "B", target: "C" }]),
      makeExtraction("C", [{ source: "C", target: "A" }]),
    ];

    const cycles = detectLayerCycles(extractions);
    expect(cycles).toHaveLength(1);
    const cycleNodes = cycles[0].cycle.slice(0, -1);
    expect(cycleNodes).toContain("A");
    expect(cycleNodes).toContain("B");
    expect(cycleNodes).toContain("C");
  });

  it("returns empty for acyclic graph", () => {
    const extractions = [
      makeExtraction("Presentation", [{ source: "Presentation", target: "Application" }]),
      makeExtraction("Application", [{ source: "Application", target: "Domain" }]),
      makeExtraction("Domain", []),
    ];

    const cycles = detectLayerCycles(extractions);
    expect(cycles).toHaveLength(0);
  });

  it("ignores self-references", () => {
    const extractions = [
      makeExtraction("A", [{ source: "A", target: "A" }]),
    ];

    const cycles = detectLayerCycles(extractions);
    expect(cycles).toHaveLength(0);
  });

  it("deduplicates the same cycle in different rotations", () => {
    // Both A→B and B→A report the same cycle
    const extractions = [
      makeExtraction("A", [{ source: "A", target: "B" }]),
      makeExtraction("B", [{ source: "B", target: "A" }]),
    ];

    const cycles = detectLayerCycles(extractions);
    expect(cycles).toHaveLength(1);
  });

  it("detects multiple independent cycles", () => {
    const extractions = [
      makeExtraction("A", [{ source: "A", target: "B" }]),
      makeExtraction("B", [{ source: "B", target: "A" }]),
      makeExtraction("C", [{ source: "C", target: "D" }]),
      makeExtraction("D", [{ source: "D", target: "C" }]),
    ];

    const cycles = detectLayerCycles(extractions);
    expect(cycles).toHaveLength(2);
  });

  it("attaches edge details to detected cycles", () => {
    const extractions = [
      makeExtraction("Infra", [
        { source: "Infra", target: "Lib", sourceFile: "/infra/client.ts", importPath: "../lib/logger" },
      ]),
      makeExtraction("Lib", [
        { source: "Lib", target: "Infra", sourceFile: "/lib/helper.ts", importPath: "../infra/repo" },
      ]),
    ];

    const cycles = detectLayerCycles(extractions);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].edges.length).toBeGreaterThan(0);
    expect(cycles[0].edges.some((e) => e.sourceFile?.includes("client.ts"))).toBe(true);
    expect(cycles[0].edges.some((e) => e.importPath?.includes("../infra/repo"))).toBe(true);
  });
});
