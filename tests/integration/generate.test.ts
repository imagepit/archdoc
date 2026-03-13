import { describe, it, expect, beforeAll } from "vitest";
import { loadConfig } from "../../src/config/loader.js";
import { createExtractorProject, extractLayer } from "../../src/extractor/project.js";
import { analyzeCallerReferences } from "../../src/extractor/caller-analyzer.js";
import { generateIndexMd } from "../../src/generator/index-generator.js";
import { generateLayerMd } from "../../src/generator/layer-generator.js";
import { MermaidRenderer } from "../../src/diagram/mermaid-renderer.js";
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
    extractions = config.layers.map((layer) => extractLayer(project, layer, config.layers));
    analyzeCallerReferences(project, extractions, config.layers);
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

  it("extracts cross-layer dependencies", () => {
    const app = extractions.find((e) => e.layerName === "Application")!;
    expect(app.dependencies.length).toBeGreaterThan(0);
    const domainDeps = app.dependencies.filter((d) => d.target === "Domain");
    expect(domainDeps.length).toBeGreaterThan(0);
    expect(domainDeps[0].sourceFile).toBeDefined();
    expect(domainDeps[0].importPath).toBeDefined();
    // Application → Domain is allowed, so none should be forbidden
    expect(domainDeps.every((d) => !d.isForbidden)).toBe(true);
  });

  it("analyzes caller references for domain methods", () => {
    const domain = extractions.find((e) => e.layerName === "Domain")!;
    const orderClass = domain.classes.find((c) => c.name === "Order")!;
    const addItemMethod = orderClass.methods.find((m) => m.name === "addItem");
    // CreateOrderUseCase calls Order.addItem()
    expect(addItemMethod?.calledBy).toBeDefined();
    expect(addItemMethod!.calledBy!.length).toBeGreaterThan(0);
    expect(addItemMethod!.calledBy!.some((c) => c.callerName.includes("CreateOrderUseCase"))).toBe(true);
  });

  it("detects interface-mediated calls with callType and interfaceName", () => {
    const infra = extractions.find((e) => e.layerName === "Infrastructure")!;
    const prismaRepo = infra.classes.find((c) => c.name === "PrismaOrderRepository")!;
    const saveMethod = prismaRepo.methods.find((m) => m.name === "save")!;

    // CreateOrderUseCase calls PrismaOrderRepository.save() via OrderRepository interface
    expect(saveMethod.calledBy).toBeDefined();
    const useCaseCaller = saveMethod.calledBy!.find((c) =>
      c.callerName.includes("CreateOrderUseCase"),
    );
    expect(useCaseCaller).toBeDefined();
    expect(useCaseCaller!.callType).toBe("interface");
    expect(useCaseCaller!.interfaceName).toBe("OrderRepository");
  });

  it("marks direct calls with callType direct", () => {
    const domain = extractions.find((e) => e.layerName === "Domain")!;
    const orderClass = domain.classes.find((c) => c.name === "Order")!;
    const addItemMethod = orderClass.methods.find((m) => m.name === "addItem")!;

    // CreateOrderUseCase calls Order.addItem() directly (not via interface)
    expect(addItemMethod.calledBy).toBeDefined();
    const useCaseCaller = addItemMethod.calledBy!.find((c) =>
      c.callerName.includes("CreateOrderUseCase"),
    );
    expect(useCaseCaller).toBeDefined();
    expect(useCaseCaller!.callType).toBe("direct");
  });

  it("renders via InterfaceName for interface-mediated calls in MD output", async () => {
    const infraLayer = config.layers.find((l) => l.name === "Infrastructure")!;
    const infraExtraction = extractions.find((e) => e.layerName === "Infrastructure")!;
    const renderer = new MermaidRenderer();
    const layerNames = config.layers.map((l) => l.name);
    const infraMd = await generateLayerMd(infraLayer, infraExtraction, { renderer, layerNames });

    expect(infraMd).toContain("via `OrderRepository`");
  });

  it("generates index.md with all layers", async () => {
    const renderer = new MermaidRenderer();
    const indexMd = await generateIndexMd(config, extractions, { renderer });

    expect(indexMd).toContain("EC Order System");
    expect(indexMd).toContain("Domain");
    expect(indexMd).toContain("ドメイン層");
    expect(indexMd).toContain("Application");
    expect(indexMd).toContain("Infrastructure");
    expect(indexMd).toContain("Presentation");
    expect(indexMd).toContain("domain.md");
    expect(indexMd).toContain("classDiagram");
  });

  it("generates domain layer MD with classes", async () => {
    const domainLayer = config.layers.find((l) => l.name === "Domain")!;
    const domainExtraction = extractions.find((e) => e.layerName === "Domain")!;
    const renderer = new MermaidRenderer();
    const domainMd = await generateLayerMd(domainLayer, domainExtraction, { renderer });

    expect(domainMd).toContain("Domain — ドメイン層 API Spec");
    expect(domainMd).toContain("`Order`");
    expect(domainMd).toContain("`Money`");
    expect(domainMd).toContain("Business Rules");
    expect(domainMd).toContain("at least one line item");
    expect(domainMd).toContain("`addItem");
    expect(domainMd).toContain("OrderNotEditableError");
  });

  it("generates application layer MD", async () => {
    const appLayer = config.layers.find((l) => l.name === "Application")!;
    const appExtraction = extractions.find((e) => e.layerName === "Application")!;
    const renderer = new MermaidRenderer();
    const appMd = await generateLayerMd(appLayer, appExtraction, { renderer });

    expect(appMd).toContain("Application — アプリケーション層 API Spec");
    expect(appMd).toContain("`CreateOrderUseCase`");
  });

  it("applies categoryOverrides to presentation layer interfaces", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const depsIface = pres.interfaces.find((i) => i.name === "OrderRouterDependencies");
    expect(depsIface).toBeDefined();
    expect(depsIface!.category).toBe("Dependency Injection");
  });

  it("extracts Express routes from router factory functions", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const routerFunc = pres.functions.find((f) => f.name === "createOrderRouter");
    expect(routerFunc).toBeDefined();
    expect(routerFunc!.routes).toBeDefined();
    expect(routerFunc!.routes!.length).toBeGreaterThanOrEqual(2);

    const postRoute = routerFunc!.routes!.find((r) => r.method === "POST");
    expect(postRoute).toBeDefined();
    expect(postRoute!.path).toBe("/");

    const getRoute = routerFunc!.routes!.find((r) => r.method === "GET");
    expect(getRoute).toBeDefined();
    expect(getRoute!.path).toBe("/:orderId");
  });

  it("extracts route handler calls to use cases", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const routerFunc = pres.functions.find((f) => f.name === "createOrderRouter")!;
    const postRoute = routerFunc.routes!.find((r) => r.method === "POST")!;

    expect(postRoute.calls.length).toBeGreaterThan(0);
    expect(postRoute.calls.some((c) => c.target === "CreateOrderUseCase" && c.method === "execute")).toBe(true);
  });

  it("generates presentation layer MD with route table and sequence diagram", async () => {
    const presLayer = config.layers.find((l) => l.name === "Presentation")!;
    const presExtraction = extractions.find((e) => e.layerName === "Presentation")!;
    const renderer = new MermaidRenderer();
    const layerNames = config.layers.map((l) => l.name);
    const presMd = await generateLayerMd(presLayer, presExtraction, { renderer, layerNames });

    // Route table
    expect(presMd).toContain("**Routes**");
    expect(presMd).toContain("`POST`");
    expect(presMd).toContain("`GET`");
    expect(presMd).toContain("`/:orderId`");

    // Sequence diagram
    expect(presMd).toContain("sequenceDiagram");
    expect(presMd).toContain("CreateOrderUseCase");
  });
});
