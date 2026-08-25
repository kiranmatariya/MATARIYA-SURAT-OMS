import { apiRequest } from "@/features/api-client";
import type { AreaRepository } from "./area-repository";
export const apiAreaRepository: AreaRepository = {
  list: () => apiRequest("/api/areas"),
  create: (input) => apiRequest("/api/areas", { method: "POST", body: JSON.stringify({ input }) }),
  update: (id, input) => apiRequest("/api/areas", { method: "PUT", body: JSON.stringify({ id, input }) }),
};
