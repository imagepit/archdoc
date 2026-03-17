import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import {
  checkResponsibilitySeparation,
  type ResponsibilityCheckerConfig,
} from "../../src/analyzer/nextjs-responsibility-checker.js";

function createProject(): Project {
  return new Project({ useInMemoryFileSystem: true });
}

const defaultConfig: ResponsibilityCheckerConfig = {
  appLayerPath: "src/app",
  infraLayerPath: "src/infrastructure",
  domainLayerPath: "src/domain",
};

describe("checkResponsibilitySeparation", () => {
  describe("Rule 1: App → Infrastructure direct dependency", () => {
    it("detects import from infrastructure layer", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/dashboard/page.tsx",
        `import { OrderRepo } from "../../infrastructure/repositories/OrderRepo";
export default function Page() { return null; }`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const infraViolations = violations.filter((v) => v.rule === "app-to-infra");
      expect(infraViolations).toHaveLength(1);
      expect(infraViolations[0].severity).toBe("high");
    });

    it("detects @/infrastructure path alias imports", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/page.tsx",
        `import { Repo } from "@/infrastructure/repositories/Repo";
export default function Page() { return null; }`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const infraViolations = violations.filter((v) => v.rule === "app-to-infra");
      expect(infraViolations).toHaveLength(1);
    });

    it("does not flag files outside app layer", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/application/usecases/SomeUseCase.ts",
        `import { Repo } from "../../infrastructure/repositories/Repo";
export class SomeUseCase {}`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Rule 2: App → Domain direct dependency", () => {
    it("detects import from domain layer", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/page.tsx",
        `import { Order } from "../domain/entities/Order";
export default function Page() { return null; }`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const domainViolations = violations.filter((v) => v.rule === "app-to-domain");
      expect(domainViolations).toHaveLength(1);
      expect(domainViolations[0].severity).toBe("medium");
    });

    it("skips type-only imports", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/page.tsx",
        `import type { Order } from "../domain/entities/Order";
export default function Page() { return null; }`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const domainViolations = violations.filter((v) => v.rule === "app-to-domain");
      expect(domainViolations).toHaveLength(0);
    });

    it("skips named type-only imports", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/page.tsx",
        `import { type Order, type OrderId } from "../domain/entities/Order";
export default function Page() { return null; }`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const domainViolations = violations.filter((v) => v.rule === "app-to-domain");
      expect(domainViolations).toHaveLength(0);
    });
  });

  describe("Rule 3: fetch() in App layer", () => {
    it("detects direct fetch() in page file", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/dashboard/page.tsx",
        `export default async function Page() {
  const data = await fetch("https://api.example.com/data");
  return null;
}`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const fetchViolations = violations.filter((v) => v.rule === "fetch-in-app");
      expect(fetchViolations).toHaveLength(1);
      expect(fetchViolations[0].severity).toBe("high");
    });

    it("detects fetch() in route file", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/api/proxy/route.ts",
        `export async function GET() {
  const data = await fetch("https://external-api.com/data");
  return Response.json(data);
}`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const fetchViolations = violations.filter((v) => v.rule === "fetch-in-app");
      expect(fetchViolations).toHaveLength(1);
    });

    it("does not flag fetch() in non-entry files", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/utils/api-client.ts",
        `export async function fetchData() {
  return await fetch("https://api.example.com/data");
}`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const fetchViolations = violations.filter((v) => v.rule === "fetch-in-app");
      expect(fetchViolations).toHaveLength(0);
    });
  });

  describe("Rule 4: DI assembly in page/layout", () => {
    it("detects new UseCase() in page file", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/dashboard/page.tsx",
        `import { CreateOrderUseCase } from "@/application/usecases/CreateOrderUseCase";
export default async function Page() {
  const useCase = new CreateOrderUseCase();
  return null;
}`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const diViolations = violations.filter((v) => v.rule === "di-in-app");
      expect(diViolations).toHaveLength(1);
      expect(diViolations[0].severity).toBe("medium");
      expect(diViolations[0].detail).toContain("CreateOrderUseCase");
    });

    it("detects new Repository() in layout file", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/layout.tsx",
        `export default function Layout({ children }: any) {
  const repo = new OrderRepository();
  return children;
}`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const diViolations = violations.filter((v) => v.rule === "di-in-app");
      expect(diViolations).toHaveLength(1);
    });

    it("does not flag DI in route files (expected for route handlers)", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/api/orders/route.ts",
        `import { CreateOrderUseCase } from "@/application/usecases/CreateOrderUseCase";
export async function POST(request: Request) {
  const useCase = new CreateOrderUseCase();
  return Response.json({});
}`,
      );

      const violations = checkResponsibilitySeparation([sf], defaultConfig);
      const diViolations = violations.filter((v) => v.rule === "di-in-app");
      expect(diViolations).toHaveLength(0);
    });
  });

  describe("config options", () => {
    it("skips infra check when infraLayerPath is not set", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/src/app/page.tsx",
        `import { Repo } from "@/infrastructure/repositories/Repo";
export default function Page() { return null; }`,
      );

      const violations = checkResponsibilitySeparation([sf], {
        appLayerPath: "src/app",
      });
      const infraViolations = violations.filter((v) => v.rule === "app-to-infra");
      expect(infraViolations).toHaveLength(0);
    });
  });
});
