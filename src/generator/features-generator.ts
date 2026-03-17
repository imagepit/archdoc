import { MarkdownBuilder } from "./markdown-builder.js";
import type { ProjectConfig } from "../types/config.js";
import type { LayerExtraction, ClassInfo, FunctionInfo } from "../types/extracted.js";
import type { LocaleMessages } from "../i18n/types.js";
import { getMessages } from "../i18n/index.js";
import type { FeaturesMessages } from "../i18n/types.js";

/** Options for features generation. */
export interface FeaturesGenerateOptions {
  messages?: LocaleMessages;
}

/**
 * Generate a feature list Markdown from extracted layer data.
 * Groups by use case / endpoint / domain model for easy comparison
 * with free-form requirements documents.
 */
export function generateFeaturesMd(
  config: ProjectConfig,
  extractions: LayerExtraction[],
  options?: FeaturesGenerateOptions,
): string {
  const md = new MarkdownBuilder();
  const t = options?.messages ?? getMessages("en");
  const ft = t.features;

  md.frontmatter({
    title: `${config.project.name} ${ft.title}`,
    description: ft.description,
  });

  md.heading(1, `${config.project.name} ${ft.title}`);
  md.paragraph(ft.generatedNote);

  // --- Section 1: API Endpoints ---
  const endpoints = collectEndpoints(extractions);
  if (endpoints.length > 0) {
    md.heading(2, ft.apiEndpoints);
    md.table(
      [ft.headerMethod, ft.headerPath, ft.headerDescription, ft.headerLayer, ft.headerComponent],
      endpoints.map((ep) => [
        `\`${ep.method}\``,
        `\`${ep.path}\``,
        ep.description || "—",
        ep.layerName,
        `\`${ep.componentName}\``,
      ]),
    );
  }

  // --- Section 2: Use Cases / Application Services ---
  const useCases = collectUseCases(extractions);
  if (useCases.length > 0) {
    md.heading(2, ft.useCases);
    md.table(
      [ft.headerFeature, ft.headerComponent, ft.headerDescription, ft.headerBusinessRules],
      useCases.map((uc) => [
        uc.name,
        `\`${uc.className}\``,
        uc.description || "—",
        uc.businessRules.length > 0 ? uc.businessRules.join("; ") : "—",
      ]),
    );
  }

  // --- Section 3: Domain Models ---
  const domainModels = collectDomainModels(extractions);
  if (domainModels.length > 0) {
    md.heading(2, ft.domainModels);
    md.table(
      [ft.headerModel, ft.headerRole, ft.headerDescription, ft.headerBusinessRules, ft.headerMethods],
      domainModels.map((dm) => [
        `\`${dm.name}\``,
        dm.role,
        dm.description || "—",
        dm.businessRules.length > 0 ? dm.businessRules.join("; ") : "—",
        dm.methods.length > 0 ? dm.methods.join(", ") : "—",
      ]),
    );
  }

  // --- Section 4: Feature Summary by Layer ---
  md.heading(2, ft.featureSummaryByLayer);

  for (const extraction of extractions) {
    const publicMethods = collectPublicMethods(extraction);
    if (publicMethods.length === 0) continue;

    md.heading(3, extraction.layerName);
    md.table(
      [ft.headerComponent, ft.headerFeature, ft.headerDescription],
      publicMethods.map((pm) => [
        `\`${pm.className}\``,
        `\`${pm.methodName}\``,
        pm.description || "—",
      ]),
    );
  }

  // --- Section 5: Business Rules Summary ---
  const allRules = collectAllBusinessRules(extractions);
  if (allRules.length > 0) {
    md.heading(2, ft.businessRulesSummary);
    md.table(
      [ft.headerLayer, ft.headerComponent, ft.headerRule],
      allRules.map((r) => [
        r.layerName,
        `\`${r.componentName}\``,
        r.rule,
      ]),
    );
  }

  return md.build();
}

// --- Data collection helpers ---

interface EndpointEntry {
  method: string;
  path: string;
  description: string;
  layerName: string;
  componentName: string;
}

function collectEndpoints(extractions: LayerExtraction[]): EndpointEntry[] {
  const entries: EndpointEntry[] = [];
  for (const ext of extractions) {
    for (const func of ext.functions) {
      if (!func.routes) continue;
      for (const route of func.routes) {
        entries.push({
          method: route.method,
          path: route.path,
          description: route.description || func.description,
          layerName: ext.layerName,
          componentName: func.name,
        });
      }
    }
  }
  return entries;
}

interface UseCaseEntry {
  name: string;
  className: string;
  description: string;
  businessRules: string[];
}

function collectUseCases(extractions: LayerExtraction[]): UseCaseEntry[] {
  const entries: UseCaseEntry[] = [];
  for (const ext of extractions) {
    for (const cls of ext.classes) {
      if (!isUseCaseOrAppService(cls)) continue;
      for (const method of cls.methods) {
        if (method.visibility !== "public") continue;
        entries.push({
          name: method.name,
          className: cls.name,
          description: method.description || cls.description,
          businessRules: [...cls.businessRules, ...method.businessRules],
        });
      }
    }
  }
  return entries;
}

function isUseCaseOrAppService(cls: ClassInfo): boolean {
  const name = cls.name.toLowerCase();
  const category = cls.category.toLowerCase();
  return (
    name.includes("usecase") ||
    name.includes("use-case") ||
    name.includes("service") ||
    name.includes("interactor") ||
    category.includes("use case") ||
    category.includes("application service")
  );
}

interface DomainModelEntry {
  name: string;
  role: string;
  description: string;
  businessRules: string[];
  methods: string[];
}

function collectDomainModels(extractions: LayerExtraction[]): DomainModelEntry[] {
  const entries: DomainModelEntry[] = [];
  for (const ext of extractions) {
    for (const cls of ext.classes) {
      if (!cls.dddRole) continue;
      entries.push({
        name: cls.name,
        role: cls.dddRole,
        description: cls.description,
        businessRules: cls.businessRules,
        methods: cls.methods
          .filter((m) => m.visibility === "public")
          .map((m) => m.name),
      });
    }
  }
  return entries;
}

interface PublicMethodEntry {
  className: string;
  methodName: string;
  description: string;
}

function collectPublicMethods(extraction: LayerExtraction): PublicMethodEntry[] {
  const entries: PublicMethodEntry[] = [];
  for (const cls of extraction.classes) {
    for (const method of cls.methods) {
      if (method.visibility !== "public") continue;
      entries.push({
        className: cls.name,
        methodName: method.name,
        description: method.description,
      });
    }
  }
  for (const func of extraction.functions) {
    if (!func.isExported) continue;
    entries.push({
      className: "(function)",
      methodName: func.name,
      description: func.description,
    });
  }
  return entries;
}

interface BusinessRuleEntry {
  layerName: string;
  componentName: string;
  rule: string;
}

function collectAllBusinessRules(extractions: LayerExtraction[]): BusinessRuleEntry[] {
  const entries: BusinessRuleEntry[] = [];
  for (const ext of extractions) {
    for (const cls of ext.classes) {
      for (const rule of cls.businessRules) {
        entries.push({ layerName: ext.layerName, componentName: cls.name, rule });
      }
      for (const method of cls.methods) {
        for (const rule of method.businessRules) {
          entries.push({ layerName: ext.layerName, componentName: `${cls.name}.${method.name}`, rule });
        }
      }
    }
    for (const func of ext.functions) {
      for (const rule of func.businessRules) {
        entries.push({ layerName: ext.layerName, componentName: func.name, rule });
      }
    }
  }
  return entries;
}
