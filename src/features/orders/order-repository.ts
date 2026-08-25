import type { Order, OrderInput } from "@/types/order";
import type { DispatchInput, OrderTransaction, ReductionInput } from "@/types/order-transaction";

export interface OrderRepository {
  list(): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  findCurrentByDealer(dealerId: string, excludeOrderId?: string): Promise<Order | null>;
  nextOrderNumber(): Promise<string>;
  createDraft(input: OrderInput): Promise<Order>;
  updateCurrent(id: string, input: OrderInput): Promise<Order>;
  deleteDraft(id: string): Promise<void>;
  confirm(id: string): Promise<Order>;
  cancel(id: string): Promise<Order>;
  listTransactions(orderId: string): Promise<OrderTransaction[]>;
  listAllTransactions(): Promise<OrderTransaction[]>;
  getTransaction(id: string): Promise<OrderTransaction | null>;
  createDispatch(id: string, input: DispatchInput): Promise<{ order: Order; transaction: OrderTransaction }>;
  createReduction(id: string, input: ReductionInput): Promise<{ order: Order; transaction: OrderTransaction }>;
}
