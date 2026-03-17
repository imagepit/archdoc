import { describe, it, expect, beforeAll } from "vitest";
import { loadConfig } from "../../src/config/loader.js";
import { createExtractorProject, extractLayer } from "../../src/extractor/project.js";
import { checkResponsibilitySeparation } from "../../src/analyzer/nextjs-responsibility-checker.js";
import { detectLayerCycles } from "../../src/analyzer/cycle-detector.js";
import { generateIndexMd } from "../../src/generator/index-generator.js";
import { join } from "node:path";
import type { Project as TsMorphProject } from "ts-morph";
import type { ProjectConfig } from "../../src/types/config.js";
import type { LayerExtraction } from "../../src/types/extracted.js";

const FIXTURES = join(import.meta.dirname, "../fixtures");

describe("Next.js generate integration", () => {
  let config: ProjectConfig;
  let project: TsMorphProject;
  let extractions: LayerExtraction[];

  beforeAll(() => {
    config = loadConfig(join(FIXTURES, "nextjs-project/layers.yaml"));
    project = createExtractorProject(config.project.sourceRoot);
    extractions = config.layers.map((layer) =>
      extractLayer(project, layer, config.layers, config.project.sourceRoot),
    );
  });

  it("extracts all 5 layers", () => {
    expect(extractions).toHaveLength(5);
    expect(extractions.map((e) => e.layerName)).toEqual([
      "Domain",
      "Application",
      "Infrastructure",
      "Lib",
      "Presentation",
    ]);
  });

  it("extracts domain layer classes", () => {
    const domain = extractions.find((e) => e.layerName === "Domain")!;
    const classNames = domain.classes.map((c) => c.name);
    expect(classNames).toContain("Order");
  });

  it("extracts application layer classes", () => {
    const app = extractions.find((e) => e.layerName === "Application")!;
    const classNames = app.classes.map((c) => c.name);
    expect(classNames).toContain("CreateOrderUseCase");
  });

  it("extracts Next.js route handlers as routes", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;

    // Find functions that have routes
    const funcsWithRoutes = pres.functions.filter(
      (f) => f.routes && f.routes.length > 0,
    );
    expect(funcsWithRoutes.length).toBeGreaterThan(0);

    // Collect all routes across all functions
    const allRoutes = funcsWithRoutes.flatMap((f) => f.routes!);

    // Should find GET and POST for /api/orders
    const ordersGet = allRoutes.find(
      (r) => r.method === "GET" && r.path === "/api/orders",
    );
    expect(ordersGet).toBeDefined();

    const ordersPost = allRoutes.find(
      (r) => r.method === "POST" && r.path === "/api/orders",
    );
    expect(ordersPost).toBeDefined();
  });

  it("extracts dynamic route parameters", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const allRoutes = pres.functions.flatMap((f) => f.routes ?? []);

    const orderById = allRoutes.find(
      (r) => r.method === "GET" && r.path === "/api/orders/:orderId",
    );
    expect(orderById).toBeDefined();
  });

  it("extracts route handler calls to use cases", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const allRoutes = pres.functions.flatMap((f) => f.routes ?? []);

    const ordersPost = allRoutes.find(
      (r) => r.method === "POST" && r.path === "/api/orders",
    );
    expect(ordersPost).toBeDefined();
    expect(ordersPost!.calls.length).toBeGreaterThan(0);
    expect(
      ordersPost!.calls.some(
        (c) => c.target === "CreateOrderUseCase" && c.method === "execute",
      ),
    ).toBe(true);
  });

  it("extracts JSDoc from route handlers", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const allRoutes = pres.functions.flatMap((f) => f.routes ?? []);

    const ordersPost = allRoutes.find(
      (r) => r.method === "POST" && r.path === "/api/orders",
    );
    expect(ordersPost?.description).toBe("Create a new order");
  });

  it("extracts auth login route", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const allRoutes = pres.functions.flatMap((f) => f.routes ?? []);

    const loginPost = allRoutes.find(
      (r) => r.method === "POST" && r.path === "/api/auth/login",
    );
    expect(loginPost).toBeDefined();
  });

  it("extracts health check route", () => {
    const pres = extractions.find((e) => e.layerName === "Presentation")!;
    const allRoutes = pres.functions.flatMap((f) => f.routes ?? []);

    const healthGet = allRoutes.find(
      (r) => r.method === "GET" && r.path === "/api/health",
    );
    expect(healthGet).toBeDefined();
  });

  describe("responsibility separation check", () => {
    it("detects App → Infrastructure direct dependency in dashboard page", () => {
      const appLayer = config.layers.find((l) => l.framework === "nextjs")!;
      const infraLayer = config.layers.find((l) => l.type === "infrastructure")!;
      const domainLayer = config.layers.find((l) => l.type === "domain")!;
      const appSourceFiles = project
        .getSourceFiles()
        .filter((sf) => sf.getFilePath().includes(`/${appLayer.path}/`));

      const violations = checkResponsibilitySeparation(appSourceFiles, {
        appLayerPath: appLayer.path,
        infraLayerPath: infraLayer.path,
        domainLayerPath: domainLayer.path,
      });

      const infraViolations = violations.filter((v) => v.rule === "app-to-infra");
      expect(infraViolations.length).toBeGreaterThan(0);
      expect(infraViolations.some((v) => v.filePath.includes("dashboard/page"))).toBe(true);
    });

    it("detects App → Domain direct dependency", () => {
      const appLayer = config.layers.find((l) => l.framework === "nextjs")!;
      const domainLayer = config.layers.find((l) => l.type === "domain")!;
      const appSourceFiles = project
        .getSourceFiles()
        .filter((sf) => sf.getFilePath().includes(`/${appLayer.path}/`));

      const violations = checkResponsibilitySeparation(appSourceFiles, {
        appLayerPath: appLayer.path,
        domainLayerPath: domainLayer.path,
      });

      const domainViolations = violations.filter((v) => v.rule === "app-to-domain");
      expect(domainViolations.length).toBeGreaterThan(0);
    });

    it("detects fetch() in page file", () => {
      const appLayer = config.layers.find((l) => l.framework === "nextjs")!;
      const appSourceFiles = project
        .getSourceFiles()
        .filter((sf) => sf.getFilePath().includes(`/${appLayer.path}/`));

      const violations = checkResponsibilitySeparation(appSourceFiles, {
        appLayerPath: appLayer.path,
      });

      const fetchViolations = violations.filter((v) => v.rule === "fetch-in-app");
      expect(fetchViolations.length).toBeGreaterThan(0);
      expect(fetchViolations.some((v) => v.filePath.includes("dashboard/page"))).toBe(true);
    });

    it("detects DI assembly in page file", () => {
      const appLayer = config.layers.find((l) => l.framework === "nextjs")!;
      const appSourceFiles = project
        .getSourceFiles()
        .filter((sf) => sf.getFilePath().includes(`/${appLayer.path}/`));

      const violations = checkResponsibilitySeparation(appSourceFiles, {
        appLayerPath: appLayer.path,
      });

      const diViolations = violations.filter((v) => v.rule === "di-in-app");
      expect(diViolations.length).toBeGreaterThan(0);
      expect(diViolations.some((v) => v.detail.includes("CreateOrderUseCase"))).toBe(true);
    });

    it("includes violations in generated index.md", async () => {
      const appLayer = config.layers.find((l) => l.framework === "nextjs")!;
      const infraLayer = config.layers.find((l) => l.type === "infrastructure")!;
      const domainLayer = config.layers.find((l) => l.type === "domain")!;
      const appSourceFiles = project
        .getSourceFiles()
        .filter((sf) => sf.getFilePath().includes(`/${appLayer.path}/`));

      const violations = checkResponsibilitySeparation(appSourceFiles, {
        appLayerPath: appLayer.path,
        infraLayerPath: infraLayer.path,
        domainLayerPath: domainLayer.path,
      });

      const indexMd = await generateIndexMd(config, extractions, {
        responsibilityViolations: violations,
      });

      expect(indexMd).toContain("Responsibility Separation Check");
      expect(indexMd).toContain("Infrastructure");
      expect(indexMd).toContain("page.tsx");
    });
  });

  describe("circular layer dependency detection", () => {
    it("detects Infrastructure ↔ Lib cycle", () => {
      const cycles = detectLayerCycles(extractions);
      expect(cycles.length).toBeGreaterThan(0);

      const infraLibCycle = cycles.find((c) =>
        c.cycle.includes("Infrastructure") && c.cycle.includes("Lib"),
      );
      expect(infraLibCycle).toBeDefined();
    });

    it("includes cycle details in generated index.md", async () => {
      const cycles = detectLayerCycles(extractions);

      const indexMd = await generateIndexMd(config, extractions, {
        layerCycles: cycles,
      });

      expect(indexMd).toContain("Circular");
      expect(indexMd).toContain("Infrastructure");
      expect(indexMd).toContain("Lib");
    });
  });
});
