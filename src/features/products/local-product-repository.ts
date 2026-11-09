import { defaultProductCategoryNames, type FanRodOption, type FanRodVariantWeight, type Product, type ProductCategory } from "@/types/product";
import type { FanRodOptionRepository, FanRodWeightRepository, ProductCategoryRepository, ProductRepository } from "./product-repository";

const PRODUCT_STORAGE_KEY = "matariya-surat-oms:products:v1";
const OPTION_STORAGE_KEY = "matariya-surat-oms:fan-rod-options:v1";
const WEIGHT_STORAGE_KEY = "matariya-surat-oms:fan-rod-weights:v1";
const CATEGORY_STORAGE_KEY = "matariya-surat-oms:product-categories:v1";

const starterProducts: Product[] = [
  { id: "product-fan-rod", name: "Fan Rod", code: "FR", category: "Fan Accessories", unit: "PCS", weightPerPieceKg: 0, remarks: "Select gauge, size and colour while ordering.", status: "ACTIVE", type: "FAN_ROD", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-10T09:00:00.000Z" },
  { id: "product-mcb", name: "MCB", code: "MCB", category: "Switchgear", unit: "BOX", weightPerPieceKg: 0, remarks: "", status: "ACTIVE", type: "NORMAL", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-10T09:00:00.000Z" },
  { id: "product-fan-clamp", name: "Fan Clamp", code: "FC", category: "Fan Accessories", unit: "PCS", weightPerPieceKg: 0, remarks: "", status: "ACTIVE", type: "NORMAL", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-10T09:00:00.000Z" },
  { id: "product-earthing-rod", name: "Earthing Rod", code: "ER", category: "Earthing", unit: "PCS", weightPerPieceKg: 0, remarks: "", status: "INACTIVE", type: "NORMAL", createdAt: "2026-08-10T09:00:00.000Z", updatedAt: "2026-08-10T09:00:00.000Z" },
];

const now = "2026-08-10T09:00:00.000Z";
const starterCategories: ProductCategory[] = defaultProductCategoryNames.map((name, index) => ({ id: `category-${index + 1}`, name, sortOrder: index + 1, status: "ACTIVE", createdAt: now, updatedAt: now }));
const starterOptions: FanRodOption[] = [
  ...["6 inch", "9 inch", "12 inch", "15 inch", "18 inch", "24 inch", "30 inch", "36 inch", "48 inch", "60 inch"].map((name, index) => ({ id: `size-${index + 1}`, kind: "SIZE" as const, name, code: name.replace(" inch", "IN"), status: "ACTIVE" as const, sortOrder: index + 1, createdAt: now, updatedAt: now })),
  ...["White", "Black", "Brown", "Ivory", "Grey", "Gold"].map((name, index) => ({ id: `colour-${index + 1}`, kind: "COLOUR" as const, name, code: name.slice(0, 3).toUpperCase(), status: "ACTIVE" as const, sortOrder: index + 1, createdAt: now, updatedAt: now })),
  ...["Standard", "Heavy", "Premium"].map((name, index) => ({ id: `gauge-${index + 1}`, kind: "GAUGE" as const, name, code: name.slice(0, 3).toUpperCase(), status: "ACTIVE" as const, sortOrder: index + 1, createdAt: now, updatedAt: now })),
];

function readList<T>(key: string, starter: T[]): T[] {
  const saved = window.localStorage.getItem(key);
  if (!saved) { window.localStorage.setItem(key, JSON.stringify(starter)); return starter; }
  try { return JSON.parse(saved) as T[]; }
  catch { window.localStorage.setItem(key, JSON.stringify(starter)); return starter; }
}

function writeList<T>(key: string, items: T[]) { window.localStorage.setItem(key, JSON.stringify(items)); }

export const localProductRepository: ProductRepository = {
  async list() { return readList(PRODUCT_STORAGE_KEY, starterProducts).sort((a, b) => a.name.localeCompare(b.name)); },
  async getById(id) { return readList(PRODUCT_STORAGE_KEY, starterProducts).find((item) => item.id === id) ?? null; },
  async create(input) {
    const products = readList(PRODUCT_STORAGE_KEY, starterProducts);
    if (input.type === "FAN_ROD" && products.some((item) => item.type === "FAN_ROD")) throw new Error("Fan Rod main product already exists.");
    const timestamp = new Date().toISOString();
    const product: Product = { ...input, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
    writeList(PRODUCT_STORAGE_KEY, [...products, product]);
    return product;
  },
  async update(id, input) {
    const products = readList(PRODUCT_STORAGE_KEY, starterProducts);
    const existing = products.find((item) => item.id === id);
    if (!existing) throw new Error("Product not found.");
    if (input.type === "FAN_ROD" && products.some((item) => item.type === "FAN_ROD" && item.id !== id)) throw new Error("Fan Rod main product already exists.");
    const updated: Product = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeList(PRODUCT_STORAGE_KEY, products.map((item) => item.id === id ? updated : item));
    return updated;
  },
};

export const localProductCategoryRepository: ProductCategoryRepository = {
  async list() { return readList(CATEGORY_STORAGE_KEY, starterCategories).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)); },
  async create(input) { const categories = readList(CATEGORY_STORAGE_KEY, starterCategories); if (categories.some((item) => item.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error("This category already exists."); const timestamp = new Date().toISOString(); const value = { ...input, id: crypto.randomUUID(), name: input.name.trim(), createdAt: timestamp, updatedAt: timestamp }; writeList(CATEGORY_STORAGE_KEY, [...categories, value]); return value; },
  async update(id, input) { const categories = readList(CATEGORY_STORAGE_KEY, starterCategories), old = categories.find((item) => item.id === id); if (!old) throw new Error("Product category not found."); if (categories.some((item) => item.id !== id && item.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error("This category already exists."); const value = { ...old, ...input, name: input.name.trim(), updatedAt: new Date().toISOString() }; writeList(CATEGORY_STORAGE_KEY, categories.map((item) => item.id === id ? value : item)); const products = readList(PRODUCT_STORAGE_KEY, starterProducts); writeList(PRODUCT_STORAGE_KEY, products.map((product) => product.category === old.name ? { ...product, category: value.name, updatedAt: value.updatedAt } : product)); return value; },
};

export const localFanRodOptionRepository: FanRodOptionRepository = {
  async list(kind) { return readList(OPTION_STORAGE_KEY, starterOptions).filter((item) => item.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder); },
  async create(kind, input) {
    const options = readList(OPTION_STORAGE_KEY, starterOptions);
    const timestamp = new Date().toISOString();
    const option: FanRodOption = { ...input, id: crypto.randomUUID(), kind, sortOrder: Math.max(0, ...options.filter((item) => item.kind === kind).map((item) => item.sortOrder)) + 1, createdAt: timestamp, updatedAt: timestamp };
    writeList(OPTION_STORAGE_KEY, [...options, option]);
    return option;
  },
  async update(id, input) {
    const options = readList(OPTION_STORAGE_KEY, starterOptions);
    const existing = options.find((item) => item.id === id);
    if (!existing) throw new Error("Fan Rod setting not found.");
    const updated: FanRodOption = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeList(OPTION_STORAGE_KEY, options.map((item) => item.id === id ? updated : item));
    return updated;
  },
};

export const localFanRodWeightRepository: FanRodWeightRepository = {
  async list() { return readList<FanRodVariantWeight>(WEIGHT_STORAGE_KEY, []); },
  async save(items) {
    const current = readList<FanRodVariantWeight>(WEIGHT_STORAGE_KEY, []);
    const byKey = new Map(current.map((item) => [`${item.gaugeId}::${item.sizeId}`, item]));
    const timestamp = new Date().toISOString();
    for (const item of items) {
      if (!Number.isFinite(item.weightPerPieceKg) || item.weightPerPieceKg <= 0) throw new Error("Every entered weight must be greater than zero.");
      const key = `${item.gaugeId}::${item.sizeId}`;
      const existing = byKey.get(key);
      byKey.set(key, { ...item, id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp });
    }
    const saved = [...byKey.values()]; writeList(WEIGHT_STORAGE_KEY, saved); return saved;
  },
};
