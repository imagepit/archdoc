import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { NextjsExtractor, classifyNextjsComponent, extractServerActions } from "../../src/extractor/framework/nextjs-extractor.js";

function createProject(): Project {
  return new Project({ useInMemoryFileSystem: true });
}

describe("NextjsExtractor", () => {
  const extractor = new NextjsExtractor();

  describe("extractRoutes", () => {
    it("extracts GET and POST from a route.ts file", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/orders/route.ts",
        `
export async function GET() {
  return Response.json({ orders: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json(body, { status: 201 });
}
`,
      );

      const getRoutes = extractor.extractRoutes(sf, "GET");
      expect(getRoutes).toHaveLength(1);
      expect(getRoutes[0].method).toBe("GET");
      expect(getRoutes[0].path).toBe("/api/orders");

      const postRoutes = extractor.extractRoutes(sf, "POST");
      expect(postRoutes).toHaveLength(1);
      expect(postRoutes[0].method).toBe("POST");
      expect(postRoutes[0].path).toBe("/api/orders");
    });

    it("extracts dynamic route parameters", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/orders/[orderId]/route.ts",
        `
export async function GET(request: Request) {
  return Response.json({ id: "1" });
}
`,
      );

      const routes = extractor.extractRoutes(sf, "GET");
      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe("/api/orders/:orderId");
    });

    it("extracts catch-all route segments", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/docs/[...slug]/route.ts",
        `
export async function GET() {
  return Response.json({});
}
`,
      );

      const routes = extractor.extractRoutes(sf, "GET");
      expect(routes[0].path).toBe("/api/docs/:slug*");
    });

    it("extracts optional catch-all route segments", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/docs/[[...slug]]/route.ts",
        `
export async function GET() {
  return Response.json({});
}
`,
      );

      const routes = extractor.extractRoutes(sf, "GET");
      expect(routes[0].path).toBe("/api/docs/:slug*?");
    });

    it("ignores non-route files", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/page.tsx",
        `
export default function Page() { return null; }
`,
      );

      const routes = extractor.extractRoutes(sf, "default");
      expect(routes).toHaveLength(0);
    });

    it("ignores non-HTTP method functions in route files", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/orders/route.ts",
        `
export function helperFunction() { return "not a route"; }

export async function GET() {
  return Response.json({});
}
`,
      );

      const helperRoutes = extractor.extractRoutes(sf, "helperFunction");
      expect(helperRoutes).toHaveLength(0);

      const getRoutes = extractor.extractRoutes(sf, "GET");
      expect(getRoutes).toHaveLength(1);
    });

    it("extracts JSDoc description from route handler", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/orders/route.ts",
        `
/**
 * POST /api/orders
 * Create a new order
 * @param items — List of item IDs
 * @returns The created order
 * @throws When items array is empty
 */
export async function POST(request: Request) {
  return Response.json({});
}
`,
      );

      const routes = extractor.extractRoutes(sf, "POST");
      expect(routes).toHaveLength(1);
      expect(routes[0].description).toBe("Create a new order");
      expect(routes[0].jsdocTags).toBeDefined();
      expect(routes[0].jsdocTags!.some((t) => t.tag === "param" && t.name === "items")).toBe(true);
      expect(routes[0].jsdocTags!.some((t) => t.tag === "returns")).toBe(true);
      expect(routes[0].jsdocTags!.some((t) => t.tag === "throws")).toBe(true);
    });

    it("filters out request/context params from JSDoc", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/test/route.ts",
        `
/**
 * Handle test request
 * @param request — The incoming request
 * @param context — Route context
 * @param userId — The user ID
 */
export async function GET(request: Request) {
  return Response.json({});
}
`,
      );

      const routes = extractor.extractRoutes(sf, "GET");
      const paramTags = routes[0].jsdocTags?.filter((t) => t.tag === "param") ?? [];
      expect(paramTags).toHaveLength(1);
      expect(paramTags[0].name).toBe("userId");
    });

    it("extracts use case calls from route handler", () => {
      const project = createProject();
      const sf = project.createSourceFile(
        "/app/api/orders/route.ts",
        `
import { CreateOrderUseCase } from "@/application/usecases/CreateOrderUseCase";

export async function POST(request: Request) {
  const body = await request.json();
  const useCase = new CreateOrderUseCase();
  const order = await useCase.execute(body.items);
  return Response.json(order);
}
`,
      );

      const routes = extractor.extractRoutes(sf, "POST");
      expect(routes[0].calls).toHaveLength(1);
      expect(routes[0].calls[0].target).toBe("CreateOrderUseCase");
      expect(routes[0].calls[0].method).toBe("execute");
    });
  });

  describe("resolveMountPrefixes", () => {
    it("is a no-op for Next.js (file-system routing)", () => {
      const project = createProject();
      // Should not throw
      extractor.resolveMountPrefixes([], [], []);
    });
  });
});

describe("classifyNextjsComponent", () => {
  it("classifies a server component page", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/dashboard/page.tsx",
      `export default function DashboardPage() { return null; }`,
    );

    const info = classifyNextjsComponent(sf);
    expect(info).not.toBeNull();
    expect(info!.fileType).toBe("page");
    expect(info!.componentType).toBe("server");
    expect(info!.routePath).toBe("/dashboard");
  });

  it("classifies a client component page", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/admin/page.tsx",
      `"use client";\nexport default function AdminPage() { return null; }`,
    );

    const info = classifyNextjsComponent(sf);
    expect(info!.fileType).toBe("page");
    expect(info!.componentType).toBe("client");
    expect(info!.routePath).toBe("/admin");
  });

  it("classifies a layout file", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/layout.tsx",
      `export default function RootLayout({ children }: any) { return children; }`,
    );

    const info = classifyNextjsComponent(sf);
    expect(info!.fileType).toBe("layout");
    expect(info!.componentType).toBe("server");
  });

  it("classifies a route file", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/api/health/route.ts",
      `export async function GET() { return Response.json({}); }`,
    );

    const info = classifyNextjsComponent(sf);
    expect(info!.fileType).toBe("route");
    expect(info!.componentType).toBe("server");
  });

  it("returns null for non-Next.js files", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/utils/helpers.ts",
      `export function helper() {}`,
    );

    const info = classifyNextjsComponent(sf);
    expect(info).toBeNull();
  });
});

describe("extractServerActions", () => {
  it("extracts server actions from file-level directive", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/actions/order-actions.ts",
      `"use server";

export async function createOrder(items: string[]) {
  return { success: true };
}

export async function deleteOrder(orderId: string) {
  return { success: true };
}

function internalHelper() {
  return "not exported";
}
`,
    );

    const actions = extractServerActions(sf);
    expect(actions).toEqual(["createOrder", "deleteOrder"]);
  });

  it("extracts inline server actions", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/components/form.ts",
      `
export async function submitForm(data: FormData) {
  "use server";
  return { success: true };
}

export function clientHelper() {
  return "not a server action";
}
`,
    );

    const actions = extractServerActions(sf);
    expect(actions).toEqual(["submitForm"]);
  });

  it("returns empty array for files without server directive", () => {
    const project = createProject();
    const sf = project.createSourceFile(
      "/app/utils/helpers.ts",
      `export function helper() { return "no server"; }`,
    );

    const actions = extractServerActions(sf);
    expect(actions).toEqual([]);
  });
});
