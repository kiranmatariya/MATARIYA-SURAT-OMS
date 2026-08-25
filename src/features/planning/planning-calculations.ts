import type { Order } from "@/types/order";
import { pendingQuantity } from "@/types/order";
import type { OrderTransaction } from "@/types/order-transaction";

export interface NormalPlanningRow {
  orderId: string; dealerId: string; dealerName: string; city: string; productId: string;
  productName: string; productCode: string; unit: string; lastAdditionDate: string;
  ordered: number; dispatched: number; cancelled: number; pending: number;
  expectedDispatchDate: string; remarks: string;
}
export interface FanRodPlanningRow {
  orderId: string; dealerId: string; dealerName: string; city: string;
  gaugeId: string; gaugeName: string; sizeId: string; sizeName: string;
  colourId: string; colourName: string; ordered: number; dispatched: number;
  cancelled: number; pending: number;
}

const productionStatuses = new Set(["CONFIRMED", "PARTIALLY_DISPATCHED"]);

function lastAdditionDate(orderId: string, productId: string, transactions: OrderTransaction[], fallback: string) {
  return transactions.filter((entry) => entry.orderId === orderId && entry.type === "ORDER_ADDITION" && entry.items.some((item) => item.productId === productId)).reduce((latest, entry) => entry.transactionDate > latest ? entry.transactionDate : latest, fallback);
}

export function buildPlanningRows(orders: Order[], transactions: OrderTransaction[], productUnits: Map<string, string>) {
  const normal: NormalPlanningRow[] = []; const fanRod: FanRodPlanningRow[] = [];
  for (const order of orders.filter((entry) => productionStatuses.has(entry.status))) {
    for (const item of order.items) {
      const pending = pendingQuantity(item); if (pending <= 0) continue;
      if (item.productType === "FAN_ROD" && item.fanRodVariant) {
        fanRod.push({ orderId: order.id, dealerId: order.dealerId, dealerName: order.dealerName, city: order.dealerCity, gaugeId: item.fanRodVariant.gaugeId, gaugeName: item.fanRodVariant.gaugeName, sizeId: item.fanRodVariant.sizeId, sizeName: item.fanRodVariant.sizeName, colourId: item.fanRodVariant.colourId, colourName: item.fanRodVariant.colourName, ordered: item.orderedQty, dispatched: item.dispatchedQty, cancelled: item.cancelledQty, pending });
      } else if (item.productType === "NORMAL") {
        normal.push({ orderId: order.id, dealerId: order.dealerId, dealerName: order.dealerName, city: order.dealerCity, productId: item.productId, productName: item.productName, productCode: item.productCode, unit: productUnits.get(item.productId) ?? "PCS", lastAdditionDate: lastAdditionDate(order.id, item.productId, transactions, order.orderDate), ordered: item.orderedQty, dispatched: item.dispatchedQty, cancelled: item.cancelledQty, pending, expectedDispatchDate: order.expectedDispatchDate, remarks: item.remarks || order.remarks });
      }
    }
  }
  return { normal, fanRod };
}

export function normalProductSummary(rows: NormalPlanningRow[]) {
  const grouped = new Map<string, { productId: string; productName: string; productCode: string; unit: string; dealers: Set<string>; pending: number }>();
  for (const row of rows) { const value = grouped.get(row.productId) ?? { productId: row.productId, productName: row.productName, productCode: row.productCode, unit: row.unit, dealers: new Set<string>(), pending: 0 }; value.dealers.add(row.dealerId); value.pending += row.pending; grouped.set(row.productId, value); }
  return [...grouped.values()].map((value) => ({ ...value, dealerCount: value.dealers.size })).sort((a, b) => b.pending - a.pending || a.productName.localeCompare(b.productName));
}

export function displayQty(value: number) { return value === 0 ? "—" : value.toLocaleString("en-IN"); }
