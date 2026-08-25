import type { Order, OrderItem } from "@/types/order";
import {
  deriveOrderItems, orderItemLineKey, transactionItemFromOrderItem,
  type OrderTransaction, type OrderTransactionType,
} from "@/types/order-transaction";

const STORAGE_KEY = "matariya-surat-oms:order-transactions:v1";

function readTransactions(): OrderTransaction[] {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try { return JSON.parse(saved) as OrderTransaction[]; }
  catch { window.localStorage.setItem(STORAGE_KEY, "[]"); return []; }
}

function writeTransactions(transactions: OrderTransaction[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function referenceSequence(reference: string, prefix: string, year: number) {
  const match = reference.match(new RegExp(`^${prefix}-${year}-(\\d+)$`));
  return match ? Number(match[1]) : 0;
}

function nextReference(prefix: "DSP" | "CAN") {
  const year = new Date().getFullYear();
  const highest = readTransactions().reduce((max, transaction) => Math.max(max, referenceSequence(transaction.referenceNumber, prefix, year)), 0);
  return `${prefix}-${year}-${String(highest + 1).padStart(4, "0")}`;
}

function makeTransaction(order: Order, type: OrderTransactionType, referenceNumber: string, transactionDate: string, items: OrderTransaction["items"], remarks = "", reason = ""): OrderTransaction {
  return {
    id: crypto.randomUUID(), type, referenceNumber, orderId: order.id,
    dealerId: order.dealerId, dealerName: order.dealerName, dealerCity: order.dealerCity,
    transactionDate, remarks, reason, items, createdAt: new Date().toISOString(),
  };
}

export const localOrderTransactionRepository = {
  listAll() { return readTransactions().sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  listForOrder(orderId: string) {
    return readTransactions().filter((transaction) => transaction.orderId === orderId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getById(id: string) { return readTransactions().find((transaction) => transaction.id === id) ?? null; },
  ensureMigrated(order: Order) {
    const all = readTransactions();
    if (all.some((transaction) => transaction.orderId === order.id)) return;
    const additions = order.items.filter((item) => item.orderedQty > 0).map((item) => transactionItemFromOrderItem(item, item.orderedQty));
    const dispatches = order.items.filter((item) => item.dispatchedQty > 0).map((item) => transactionItemFromOrderItem(item, item.dispatchedQty));
    const reductions = order.items.filter((item) => item.cancelledQty > 0).map((item) => transactionItemFromOrderItem(item, item.cancelledQty));
    const migrated: OrderTransaction[] = [makeTransaction(order, "ORDER_ADDITION", order.orderNumber, order.orderDate, additions, order.remarks)];
    if (dispatches.length) migrated.push(makeTransaction(order, "DISPATCH", `DSP-LEGACY-${order.orderNumber}`, order.orderDate, dispatches, "Migrated from existing order totals"));
    if (reductions.length) migrated.push(makeTransaction(order, "CANCELLATION_REDUCTION", `CAN-LEGACY-${order.orderNumber}`, order.orderDate, reductions, "Migrated from existing order totals", "Previous cancellation / reduction"));
    writeTransactions([...all, ...migrated]);
  },
  summary(order: Order) {
    this.ensureMigrated(order);
    return deriveOrderItems(this.listForOrder(order.id));
  },
  appendAddition(order: Order, items: OrderItem[], remarks = "") {
    const entries = items.filter((item) => item.orderedQty > 0).map((item) => transactionItemFromOrderItem(item, item.orderedQty));
    if (!entries.length) throw new Error("At least one ordered quantity is required.");
    const transaction = makeTransaction(order, "ORDER_ADDITION", order.orderNumber, order.orderDate, entries, remarks);
    writeTransactions([...readTransactions(), transaction]);
    return transaction;
  },
  appendProcessed(order: Order, type: "DISPATCH" | "CANCELLATION_REDUCTION", transactionDate: string, quantities: {lineKey: string; quantity: number; unitWeightKg?: number}[], remarks: string, reason = "") {
    const summary = order.items.length ? order.items : this.summary(order);
    const requested = quantities.filter((entry) => entry.quantity > 0);
    if (!requested.length) throw new Error(type === "DISPATCH" ? "Enter at least one dispatch quantity." : "Enter at least one reduction quantity.");
    const items = requested.map((entry) => {
      const line = summary.find((item) => orderItemLineKey(item) === entry.lineKey);
      if (!line) throw new Error("One selected order line was not found.");
      const pending = line.orderedQty - line.dispatchedQty - line.cancelledQty;
      if (entry.quantity > pending) throw new Error(`${line.productName}: quantity cannot exceed current pending quantity (${pending}).`);
      return transactionItemFromOrderItem(line, entry.quantity, type === "DISPATCH" ? entry.unitWeightKg ?? 0 : 0);
    });
    const reference = nextReference(type === "DISPATCH" ? "DSP" : "CAN");
    const transaction = makeTransaction(order, type, reference, transactionDate, items, remarks, reason);
    writeTransactions([...readTransactions(), transaction]);
    return transaction;
  },
  deleteDraftHistory(orderId: string) {
    writeTransactions(readTransactions().filter((transaction) => transaction.orderId !== orderId));
  },
};
