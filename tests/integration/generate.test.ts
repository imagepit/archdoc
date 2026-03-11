import { describe, it, expect, beforeAll } from "vitest";
import { loadConfig } from "../../src/config/loader.js";
import { createExtractorProject, extractLayer } from "../../src/extractor/project.js";
import { generateIndexMd } from "../../src/generator/index-generator.js";
import { generateLayerMd } from "../../src/generator/layer-generator.js";
import { join } from "node:path";
import type { Project } from "ts-morph";
import type { ProjectConfig } from "../../src/types/config.js";
import type { LayerExtraction } from "../../src/types/extracted.js";

const FIXTURES = join(import.meta.dirname, "../fixtures");

describe("generate integration", () => {
  let config: ProjectConfig;
  let project: Project;
  let extractions: LayerExtraction[];

  beforeAll(() => {
    config = loadConfig(join(FIXTURES, "layers.yaml"));
    project = createExtractorProject(config.project.sourceRoot);
    extractions = config.layers.map((layer) => extractLayer(project, layer));
  });

  it("extracts all 4 layers", () => {
    expect(extractions).toHaveLength(4);
    expect(extractions.map((e) => e.layerName)).toEqual([
      "Domain",
      "Application",
      "Infrastructure",
      "Presentation",
    ]);
  });

  it("extracts domain layer classes", () => {
    const domain = extractions.find((e) => e.layerName === "Domain")!;
    expect(domain.classes.length).toBeGreaterThanOrEqual(2); // Order, Money
    const classNames = domain.classes.map((c) => c.name);
    expect(classNames).toContain("Order");
    expect(classNames).toContain("Money");
  });

  it("extracts domain layer interfaces", () => {
    const domain = extractions.find((e) => e.layerName === "Domain")!;
    const ifaceNames = domain.interfaces.map((i) => i.name);
    expect(ifaceNames).toContain("OrderRepository");
  });

  it("extracts domain layer functions", () => {
    const domain = extractions.find((e) => e.layerName === "Domain")!;
    const funcNames = domain.functions.map((f) => f.name);
    expect(funcNames).toContain("calculateTax");
    expect(funcNames).toContain("applyDiscount");
  });

  it("generates index.md with all layers", () => {
    const indexMd = generateIndexMd(config, extractions);

    expect(indexMd).toContain("EC Order System");
    expect(indexMd).toContain("Domain");
    expect(indexMd).toContain("ドメイン層");
    expect(indexMd).toContain("Application");
    expect(indexMd).toContain("Infrastructure");
    expect(indexMd).toContain("Presentation");
    expect(indexMd).toContain("domain.md");
  });

  it("generates domain layer MD with classes", () => {
    const domainLayer = config.layers.find((l) => l.name === "Domain")!;
    const domainExtraction = extractions.find((e) => e.layerName === "Domain")!;
    const domainMd = generateLayerMd(domainLayer, domainExtraction);

    expect(domainMd).toContain("Domain — ドメイン層 API Spec");
    expect(domainMd).toContain("`Order`");
    expect(domainMd).toContain("`Money`");
    expect(domainMd).toContain("Business Rules");
    expect(domainMd).toContain("at least one line item");
    expect(domainMd).toContain("`addItem");
    expect(domainMd).toContain("OrderNotEditableError");
  });

  it("generates application layer MD", () => {
    const appLayer = config.layers.find((l) => l.name === "Application")!;
    const appExtraction = extractions.find((e) => e.layerName === "Application")!;
    const appMd = generateLayerMd(appLayer, appExtraction);

    expect(appMd).toContain("Application — アプリケーション層 API Spec");
    expect(appMd).toContain("`CreateOrderUseCase`");
  });
});
