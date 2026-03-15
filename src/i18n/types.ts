import type { ObjectKind } from "../generator/emoji.js";

/** Supported locale identifiers. */
export type Locale = "en" | "ja";

/** Category key for domain pattern matching. */
export type CategoryKey =
  | "entityAggregate"
  | "valueObject"
  | "repository"
  | "useCase"
  | "domainService"
  | "routerController"
  | "dtoDependencyInjection"
  | "middlewareAuthValidation"
  | "error"
  | "port"
  | "externalService";

/** All translatable messages used in generated documentation. */
export interface LocaleMessages {
  /** Strings used in index.md generation. */
  index: {
    // Headings
    systemArchitectureOverview: string;
    project: string;
    layerOverview: string;
    layerDependency: string;
    legend: string;
    crossLayerViolations: string;
    importViolations: string;
    nonStandardWarnings: string;

    // Table headers - project info
    headerItem: string;
    headerDetail: string;

    // Table headers - layer overview
    headerLayer: string;
    headerPath: string;
    headerResponsibility: string;
    headerForbiddenImports: string;
    headerDetails: string;

    // Table headers - legend
    headerIcon: string;
    headerDescription: string;
    headerCategory: string;

    // Table headers - import violations
    headerSourceLayer: string;
    headerFile: string;
    headerForbiddenImport: string;
    headerTargetLayer: string;

    // Table headers - component overview
    headerComponent: string;
    headerKind: string;

    // Labels
    labelName: string;
    labelDescription: string;
    labelSourceRoot: string;
    kindLegendLabel: string;
    categoryLegendLabel: string;

    // Dynamic text
    forbiddenImportsDetected: (count: number) => string;
    nonStandardWarningText: string;
    noExportedComponents: string;
    dddOverviewSuffix: string;
  };

  /** Strings used in layer-specific .md generation. */
  layer: {
    // Headings
    apiSpec: string;
    responsibilitiesAndConstraints: string;

    // Table headers
    headerProperty: string;
    headerType: string;
    headerRequired: string;
    headerParameter: string;
    headerError: string;
    headerMethod: string;
    headerPath: string;
    headerMiddleware: string;
    headerName: string;
    headerValue: string;
    headerDescription: string;

    // Labels
    labelPath: string;
    labelResponsibility: string;
    labelForbiddenImports: string;
    labelFile: string;
    labelType: string;
    labelBusinessRules: string;
    labelProperties: string;
    labelMethods: string;
    labelReturns: string;
    labelThrows: string;
    labelCalledBy: string;
    labelMiddleware: string;
    labelRoutes: string;
    labelMembers: string;
    labelGeneral: string;
  };

  /** Object kind display descriptions. */
  kinds: Record<ObjectKind, string>;

  /** Domain category display labels. */
  categories: Record<CategoryKey, string>;
}
