import type { Order, OrderItem, OrderItemVariantReference } from "./order";
import type { ProductType } from "./product";

export type OrderTransactionType = "ORDER_ADDITION" | "DISPATCH" | "CANCELLATION_REDUCTION";

export interface OrderTransactionItem {
  id: string;
  lineKey: string;
  productId: string;
  productName: string;
  productCode: string;
  productType: ProductType;
  fanRodVariant: OrderItemVariantReference | null;
  quantity: number;
  unitWeightKg: number;
  remarks: string;
}

export interface OrderTransaction {
  id: string;
  type: OrderTransactionType;
  referenceNumber: string;
  orderId: string;
  dealerId: string;
  dealerName: string;
  dealerCity: string;
  transactionDate: string;
  remarks: string;
  reason: string;
  items: OrderTransactionItem[];
  createdAt: string;
  createdById?: string | null;
  createdByName?: string;
}

export interface QuantityEntry { lineKey: string; quantity: number; unitWeightKg?: number }
export interface DispatchInput { dispatchDate: string; remarks: string; items: QuantityEntry[] }
export interface ReductionInput { reductionDate: string; reason: string; remarks: string; items: QuantityEntry[] }
export type DispatchCompletionType = "PARTIAL" | "FINAL";

export function orderItemLineKey(item: Pick<OrderItem, "productId" | "fanRodVariant">) {
  const variant = item.fanRodVariant;
  return [item.productId, variant?.gaugeId ?? "", variant?.sizeId ?? "", variant?.colourId ?? ""].join("::");
}

export function transactionItemFromOrderItem(item: OrderItem, quantity: number, unitWeightKg = 0): OrderTransactionItem {
  return {
    id: crypto.randomUUID(), lineKey: orderItemLineKey(item), productId: item.productId,
    productName: item.productName, productCode: item.productCode, productType: item.productType,
    fanRodVariant: item.fanRodVariant, quantity, unitWeightKg, remarks: item.remarks,
  };
}

export function deriveOrderItems(transactions: OrderTransaction[]): OrderItem[] {
  const summary = new Map<string, OrderItem>();
  for (const transaction of transactions.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    for (const entry of transaction.items) {
      const current = summary.get(entry.lineKey) ?? {
        id: entry.lineKey, productId: entry.productId, productName: entry.productName,
        productCode: entry.productCode, productType: entry.productType,
        fanRodVariant: entry.fanRodVariant, orderedQty: 0, dispatchedQty: 0,
        cancelledQty: 0, remarks: entry.remarks,
      };
      if (transaction.type === "ORDER_ADDITION") current.orderedQty += entry.quantity;
      if (transaction.type === "DISPATCH") current.dispatchedQty += entry.quantity;
      if (transaction.type === "CANCELLATION_REDUCTION") current.cancelledQty += entry.quantity;
      if (transaction.type === "ORDER_ADDITION" && entry.remarks) current.remarks = entry.remarks;
      summary.set(entry.lineKey, current);
    }
  }
  return [...summary.values()];
}

export function statusFromHistory(order: Order, items: OrderItem[]): Order["status"] {
  if (order.status === "DRAFT" || order.status === "CANCELLED") return order.status;
  const pending = items.reduce((sum, item) => sum + item.orderedQty - item.dispatchedQty - item.cancelledQty, 0);
  if (pending === 0) return "COMPLETED";
  if (items.some((item) => item.dispatchedQty > 0)) return "PARTIALLY_DISPATCHED";
  return "CONFIRMED";
}

export function dispatchCompletionType(dispatchId: string, transactions: OrderTransaction[]): DispatchCompletionType {
  const ordered = new Map<string, number>(); const dispatched = new Map<string, number>(); const cancelled = new Map<string, number>();
  const chronological = [...transactions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const transaction of chronological) {
    for (const item of transaction.items) {
      const target = transaction.type === "ORDER_ADDITION" ? ordered : transaction.type === "DISPATCH" ? dispatched : cancelled;
      target.set(item.lineKey, (target.get(item.lineKey) ?? 0) + item.quantity);
    }
    if (transaction.id === dispatchId) {
      const pending = [...ordered.entries()].reduce((sum, [key, quantity]) => sum + quantity - (dispatched.get(key) ?? 0) - (cancelled.get(key) ?? 0), 0);
      return pending === 0 ? "FINAL" : "PARTIAL";
    }
  }
  return "PARTIAL";
}
