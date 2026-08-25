import type { OrderRepository } from "./order-repository";
import { apiRequest } from "@/features/api-client";
const get = <T>(action: string, values: Record<string,string> = {}) => apiRequest<T>(`/api/orders?${new URLSearchParams({action,...values})}`);
const post = <T>(action: string, body: object = {}) => apiRequest<T>("/api/orders", { method:"POST", body:JSON.stringify({action,...body}) });
export const apiOrderRepository: OrderRepository = {
  list:()=>get("list"), getById:(id)=>get("get",{id}), findCurrentByDealer:(dealerId,excludeOrderId)=>get("current",{dealerId,...(excludeOrderId?{excludeOrderId}:{})}), nextOrderNumber:()=>get("next"),
  createDraft:(input)=>post("create",{input}), updateCurrent:(id,input)=>post("update",{id,input}), deleteDraft:(id)=>post("delete",{id}), confirm:(id)=>post("confirm",{id}), cancel:(id)=>post("cancel",{id}),
  listTransactions:(orderId)=>get("transactions",{orderId}), listAllTransactions:()=>get("all-transactions"), getTransaction:(id)=>get("transaction",{id}),
  createDispatch:(id,input)=>post("dispatch",{id,input}), createReduction:(id,input)=>post("reduction",{id,input}),
};
