export type RecordStatus = "ACTIVE" | "INACTIVE";
export type ProductType = "NORMAL" | "FAN_ROD";
export type FanRodOptionKind = "SIZE" | "COLOUR" | "GAUGE";

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  weightPerPieceKg: number;
  remarks: string;
  status: RecordStatus;
  type: ProductType;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Pick<Product, "name" | "code" | "category" | "unit" | "weightPerPieceKg" | "remarks" | "status" | "type">;

export interface FanRodOption {
  id: string;
  kind: FanRodOptionKind;
  name: string;
  code: string;
  status: RecordStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type FanRodOptionInput = Pick<FanRodOption, "name" | "code" | "status">;

export interface FanRodVariantWeight {
  id: string;
  gaugeId: string;
  sizeId: string;
  weightPerPieceKg: number;
  createdAt: string;
  updatedAt: string;
}

export type FanRodVariantWeightInput = Pick<FanRodVariantWeight, "gaugeId" | "sizeId" | "weightPerPieceKg">;
