import type { DealerRepository } from "./dealer-repository";
import { apiRequest } from "@/features/api-client";
export const apiDealerRepository: DealerRepository = {
  list: () => apiRequest("/api/dealers"),
  getById: (id) => apiRequest(`/api/dealers?id=${encodeURIComponent(id)}`),
  create: (input) => apiRequest("/api/dealers", { method: "POST", body: JSON.stringify({ input }) }),
  update: (id, input) => apiRequest("/api/dealers", { method: "PUT", body: JSON.stringify({ id, input }) }),
};
