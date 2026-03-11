import type { LayerType } from "../types/config.js";

const DEFAULT_CATEGORIES: Record<LayerType, Record<string, string>> = {
  domain: {
    entities: "Entity",
    valueObjects: "Value Object",
    repositories: "Repository Interface",
    services: "Domain Service",
  },
  application: {
    usecases: "Use Case",
    services: "Application Service",
    dtos: "DTO",
  },
  presentation: {
    controllers: "Controller",
    handlers: "Handler",
    middleware: "Middleware",
  },
  infrastructure: {
    repositories: "Repository Implementation",
    adapters: "Adapter",
    clients: "External Client",
  },
  custom: {},
};

export function getDefaultCategories(layerType: LayerType): Record<string, string> {
  return { ...DEFAULT_CATEGORIES[layerType] };
}
