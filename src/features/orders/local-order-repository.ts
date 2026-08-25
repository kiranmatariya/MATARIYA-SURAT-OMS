import type { Order, OrderItem } from "@/types/order";
import { orderItemLineKey, statusFromHistory } from "@/types/order-transaction";
import type { OrderRepository } from "./order-repository";
import { localOrderTransactionRepository as transactions } from "./local-order-transaction-repository";

const STORAGE_KEY = "matariya-surat-oms:orders:v1";
const currentStatuses = new Set(["DRAFT", "CONFIRMED", "PARTIALLY_DISPATCHED"]);
function readRawOrders(): Order[] { const saved = window.localStorage.getItem(STORAGE_KEY); if (!saved) return []; try { return JSON.parse(saved) as Order[]; } catch { window.localStorage.setItem(STORAGE_KEY, "[]"); return []; } }
function writeOrders(orders: Order[]) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
function replaceOrder(updated: Order) { writeOrders(readRawOrders().map((order) => order.id === updated.id ? updated : order)); }
function currentDealerArea(order: Order) {
  try {
    const dealers = JSON.parse(window.localStorage.getItem("matariya-surat-oms:dealers:v1") || "[]") as Array<{ id: string; masterAreaId: string; masterAreaName: string }>;
    const dealer = dealers.find((entry) => entry.id === order.dealerId);
    return dealer ? { masterAreaId: dealer.masterAreaId, masterAreaName: dealer.masterAreaName } : { masterAreaId: order.masterAreaId, masterAreaName: order.masterAreaName };
  } catch { return { masterAreaId: order.masterAreaId, masterAreaName: order.masterAreaName }; }
}
function hydrate(order: Order): Order { const items = transactions.summary(order).map((item) => ({ ...item, remarks: order.itemRemarks?.[orderItemLineKey(item)] ?? item.remarks })); return { ...order, ...currentDealerArea(order), items, status: statusFromHistory(order, items) }; }
function itemRemarkMap(items: OrderItem[], existing: Record<string, string> = {}) { const result = { ...existing }; for (const item of items) if (item.productId) result[orderItemLineKey(item)] = item.remarks; return result; }
function validateOrderItems(items: OrderItem[]) { if (!items.length) throw new Error("At least one order item is required."); for (const item of items) { if (!item.productId) throw new Error("Select a valid product for every order line."); if (!Number.isFinite(item.orderedQty) || item.orderedQty <= 0) throw new Error(`${item.productName || "Order item"}: quantity must be greater than zero.`); if (item.productType === "FAN_ROD" && (!item.fanRodVariant?.gaugeId || !item.fanRodVariant.sizeId || !item.fanRodVariant.colourId)) throw new Error("Fan Rod requires Gauge / Quality, Size, and Colour."); } }
function preparedItems(items: OrderItem[]) { return items.map((item) => ({ ...item, id: item.id || crypto.randomUUID(), dispatchedQty: 0, cancelledQty: 0 })); }
function sequence(value: string) { const match = value.match(/^ORD-\d{4}-(\d+)$/); return match ? Number(match[1]) : 0; }
function findCurrent(dealerId: string, exclude?: string) { return readRawOrders().map(hydrate).find((order) => order.dealerId === dealerId && order.id !== exclude && currentStatuses.has(order.status)) ?? null; }
function updateStatus(order: Order) { const items = transactions.summary(order); const updated = { ...order, items, status: statusFromHistory(order, items), updatedAt: new Date().toISOString() }; replaceOrder(updated); return updated; }

export const localOrderRepository: OrderRepository = {
  async list() { return readRawOrders().map(hydrate).sort((a, b) => b.orderDate.localeCompare(a.orderDate) || b.createdAt.localeCompare(a.createdAt)); },
  async getById(id) { const order = readRawOrders().find((entry) => entry.id === id); return order ? hydrate(order) : null; },
  async findCurrentByDealer(dealerId, exclude) { return findCurrent(dealerId, exclude); },
  async nextOrderNumber() { const year = new Date().getFullYear(); const prefix = `ORD-${year}-`; const highest = readRawOrders().filter((order) => order.orderNumber.startsWith(prefix)).reduce((max, order) => Math.max(max, sequence(order.orderNumber)), 0); return `${prefix}${String(highest + 1).padStart(4, "0")}`; },
  async createDraft(input) {
    validateOrderItems(input.items);
    const current = findCurrent(input.dealerId); if (current) throw new Error(`${input.dealerName} already has current order ${current.orderNumber}. Open that order instead.`);
    const completed = readRawOrders().map(hydrate).filter((order) => order.dealerId === input.dealerId && order.status === "COMPLETED").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (completed) {
      const reopened: Order = { ...completed, ...input, status: "CONFIRMED", items: completed.items, itemRemarks: itemRemarkMap(input.items, completed.itemRemarks), cancelledAt: null, updatedAt: new Date().toISOString() };
      transactions.appendAddition(reopened, preparedItems(input.items), input.remarks); replaceOrder(reopened); return updateStatus(reopened);
    }
    const timestamp = new Date().toISOString(); const prepared = preparedItems(input.items); const order: Order = { ...input, id: crypto.randomUUID(), orderNumber: await this.nextOrderNumber(), status: "DRAFT", items: prepared, itemRemarks: itemRemarkMap(prepared), createdAt: timestamp, updatedAt: timestamp, confirmedAt: null, cancelledAt: null };
    writeOrders([...readRawOrders(), order]); transactions.appendAddition(order, order.items, input.remarks); return hydrate(order);
  },
  async updateCurrent(id, input) {
    validateOrderItems(input.items);
    const raw = readRawOrders().find((order) => order.id === id); if (!raw) throw new Error("Order not found."); const existing = hydrate(raw);
    if (!currentStatuses.has(existing.status)) throw new Error("Completed or cancelled orders cannot be edited.");
    const duplicate = findCurrent(input.dealerId, id); if (duplicate) throw new Error(`${input.dealerName} already has current order ${duplicate.orderNumber}. Open that order instead.`);
    const desiredByKey = new Map<string, OrderItem>(); for (const item of preparedItems(input.items)) { const key = orderItemLineKey(item); const current = desiredByKey.get(key); desiredByKey.set(key, current ? { ...current, orderedQty: current.orderedQty + item.orderedQty, remarks: item.remarks || current.remarks } : item); } const additions: OrderItem[] = [];
    for (const oldItem of existing.items) { const key = orderItemLineKey(oldItem); const next = desiredByKey.get(key); const pending = oldItem.orderedQty - oldItem.dispatchedQty - oldItem.cancelledQty; if (!next && pending === 0) continue; if (pending === 0 && next) { additions.push(next); desiredByKey.delete(key); continue; } if (!next) { if (oldItem.dispatchedQty > 0 || oldItem.cancelledQty > 0) throw new Error(`${oldItem.productName}: this line has dispatch or reduction history and cannot be changed. Add the corrected item as a new line.`); transactions.appendProcessed(existing, "CANCELLATION_REDUCTION", input.orderDate, [{ lineKey: key, quantity: pending }], "Saved product or Fan Rod specification corrected from the order edit form.", "Order entry correction"); continue; } if (next.orderedQty < oldItem.orderedQty) throw new Error(`${oldItem.productName}: use Reduce / Cancel Pending Qty to lower an existing order line.`); if (next.orderedQty > oldItem.orderedQty) additions.push({ ...next, orderedQty: next.orderedQty - oldItem.orderedQty }); desiredByKey.delete(key); }
    for (const item of desiredByKey.values()) additions.push(item);
    const updated: Order = { ...raw, ...input, items: existing.items, itemRemarks: itemRemarkMap(input.items, raw.itemRemarks), status: existing.status, updatedAt: new Date().toISOString() }; if (additions.length) transactions.appendAddition(updated, additions, input.remarks); replaceOrder(updated); return hydrate(updated);
  },
  async deleteDraft(id) { const orders = readRawOrders(); const existing = orders.find((order) => order.id === id); if (!existing) throw new Error("Order not found."); if (existing.status !== "DRAFT") throw new Error("Only draft orders can be permanently deleted."); writeOrders(orders.filter((order) => order.id !== id)); transactions.deleteDraftHistory(id); },
  async confirm(id) { const existing = readRawOrders().find((order) => order.id === id); if (!existing) throw new Error("Order not found."); if (existing.status !== "DRAFT") throw new Error("Only draft orders can be confirmed."); const timestamp = new Date().toISOString(); const updated: Order = { ...existing, status: "CONFIRMED", confirmedAt: timestamp, updatedAt: timestamp }; replaceOrder(updated); return hydrate(updated); },
  async cancel(id) { const raw = readRawOrders().find((order) => order.id === id); if (!raw) throw new Error("Order not found."); const existing = hydrate(raw); if (existing.status === "CANCELLED" || existing.status === "COMPLETED") throw new Error("This order cannot be cancelled."); const pending = existing.items.map((item) => ({ lineKey: orderItemLineKey(item), quantity: item.orderedQty - item.dispatchedQty - item.cancelledQty })).filter((item) => item.quantity > 0); if (pending.length) transactions.appendProcessed(existing, "CANCELLATION_REDUCTION", new Date().toISOString().slice(0, 10), pending, "Entire remaining order cancelled", "Customer cancelled"); const timestamp = new Date().toISOString(); const updated: Order = { ...raw, status: "CANCELLED", cancelledAt: timestamp, updatedAt: timestamp }; replaceOrder(updated); return hydrate(updated); },
  async listTransactions(orderId) { return transactions.listForOrder(orderId); },
  async listAllTransactions() { return transactions.listAll(); },
  async getTransaction(id) { return transactions.getById(id); },
  async createDispatch(id, input) { const order = await this.getById(id); if (!order) throw new Error("Order not found."); if (order.status !== "CONFIRMED" && order.status !== "PARTIALLY_DISPATCHED") throw new Error("Only a confirmed running order can be dispatched."); const transaction = transactions.appendProcessed(order, "DISPATCH", input.dispatchDate, input.items, input.remarks); return { order: updateStatus(order), transaction }; },
  async createReduction(id, input) { const order = await this.getById(id); if (!order) throw new Error("Order not found."); if (order.status !== "CONFIRMED" && order.status !== "PARTIALLY_DISPATCHED") throw new Error("Only a confirmed running order can be reduced."); if (!input.reason || !input.remarks.trim()) throw new Error("Reason and remarks are required."); const transaction = transactions.appendProcessed(order, "CANCELLATION_REDUCTION", input.reductionDate, input.items, input.remarks, input.reason); return { order: updateStatus(order), transaction }; },
};
