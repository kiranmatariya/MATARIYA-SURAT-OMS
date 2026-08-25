import type { FanRodOption, FanRodOptionInput, FanRodOptionKind, FanRodVariantWeight, FanRodVariantWeightInput, Product, ProductInput } from "@/types/product";

export interface ProductRepository {
  list(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product>;
}

export interface FanRodOptionRepository {
  list(kind: FanRodOptionKind): Promise<FanRodOption[]>;
  create(kind: FanRodOptionKind, input: FanRodOptionInput): Promise<FanRodOption>;
  update(id: string, input: FanRodOptionInput): Promise<FanRodOption>;
}

export interface FanRodWeightRepository {
  list(): Promise<FanRodVariantWeight[]>;
  save(items: FanRodVariantWeightInput[]): Promise<FanRodVariantWeight[]>;
}
