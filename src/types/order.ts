import type { ProductType } from "./product";

export type OrderStatus = "DRAFT" | "CONFIRMED" | "PARTIALLY_DISPATCHED" | "COMPLETED" | "CANCELLED";

export interface OrderItemVariantReference {
  gaugeId: string;
  gaugeName: string;
  sizeId: string;
  sizeName: string;
  colourId: string;
  colourName: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  productType: ProductType;
  fanRodVariant: OrderItemVariantReference | null;
  orderedQty: number;
  dispatchedQty: number;
  cancelledQty: number;
  remarks: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  dealerId: string;
  dealerName: string;
  dealerCity: string;
  dealerMobileNumber: string;
  dealerGstNumber: string;
  masterAreaId: string;
  masterAreaName: string;
  customerReference: string;
  expectedDispatchDate: string;
  remarks: string;
  status: OrderStatus;
  items: OrderItem[];
  itemRemarks?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

export type OrderInput = Pick<Order, "orderDate" | "dealerId" | "dealerName" | "dealerCity" | "dealerMobileNumber" | "dealerGstNumber" | "masterAreaId" | "masterAreaName" | "customerReference" | "expectedDispatchDate" | "remarks" | "items">;

export function pendingQuantity(item: Pick<OrderItem, "orderedQty" | "dispatchedQty" | "cancelledQty">) {
  return item.orderedQty - item.dispatchedQty - item.cancelledQty;
}

export function totalOrderedQuantity(order: Pick<Order, "items">) {
  return order.items.reduce((total, item) => total + item.orderedQty, 0);
}
