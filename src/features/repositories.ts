import { localDealerRepository } from "@/features/dealers/local-dealer-repository";
import { apiDealerRepository } from "@/features/dealers/api-dealer-repository";
import { localProductRepository, localProductCategoryRepository, localFanRodOptionRepository, localFanRodWeightRepository } from "@/features/products/local-product-repository";
import { apiProductRepository, apiProductCategoryRepository, apiFanRodOptionRepository, apiFanRodWeightRepository } from "@/features/products/api-product-repository";
import { localOrderRepository } from "@/features/orders/local-order-repository";
import { apiOrderRepository } from "@/features/orders/api-order-repository";
import { localAreaRepository } from "@/features/areas/local-area-repository";
import { apiAreaRepository } from "@/features/areas/api-area-repository";

const postgres = process.env.NEXT_PUBLIC_DATA_PROVIDER === "postgres";
export const dealerRepository = postgres ? apiDealerRepository : localDealerRepository;
export const productRepository = postgres ? apiProductRepository : localProductRepository;
export const productCategoryRepository = postgres ? apiProductCategoryRepository : localProductCategoryRepository;
export const fanRodOptionRepository = postgres ? apiFanRodOptionRepository : localFanRodOptionRepository;
export const fanRodWeightRepository = postgres ? apiFanRodWeightRepository : localFanRodWeightRepository;
export const orderRepository = postgres ? apiOrderRepository : localOrderRepository;
export const areaRepository = postgres ? apiAreaRepository : localAreaRepository;
