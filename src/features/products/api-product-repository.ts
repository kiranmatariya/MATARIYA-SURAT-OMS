import type { FanRodOptionRepository, FanRodWeightRepository, ProductCategoryRepository, ProductRepository } from "./product-repository";
import { apiRequest } from "@/features/api-client";
export const apiProductRepository: ProductRepository = {
  list: () => apiRequest("/api/products"), getById: (id) => apiRequest(`/api/products?id=${encodeURIComponent(id)}`),
  create: (input) => apiRequest("/api/products", { method: "POST", body: JSON.stringify({ input }) }),
  update: (id, input) => apiRequest("/api/products", { method: "PUT", body: JSON.stringify({ id, input }) }),
};
export const apiProductCategoryRepository: ProductCategoryRepository = {
  list: () => apiRequest("/api/product-categories"),
  create: (input) => apiRequest("/api/product-categories", { method: "POST", body: JSON.stringify({ input }) }),
  update: (id, input) => apiRequest("/api/product-categories", { method: "PUT", body: JSON.stringify({ id, input }) }),
};
export const apiFanRodOptionRepository: FanRodOptionRepository = {
  list: (kind) => apiRequest(`/api/fan-rod-options?kind=${kind}`),
  create: (kind, input) => apiRequest("/api/fan-rod-options", { method: "POST", body: JSON.stringify({ kind, input }) }),
  update: (id, input) => apiRequest("/api/fan-rod-options", { method: "PUT", body: JSON.stringify({ id, input }) }),
};
export const apiFanRodWeightRepository: FanRodWeightRepository = {
  list: () => apiRequest("/api/fan-rod-weights"),
  save: (items) => apiRequest("/api/fan-rod-weights", { method: "PUT", body: JSON.stringify({ items }) }),
};
