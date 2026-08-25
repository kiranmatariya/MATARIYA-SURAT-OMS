"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { orderRepository } from "@/features/repositories";
import { pendingQuantity, type Order } from "@/types/order";
import { orderItemDisplayName } from "./order-list";

export function AreaPendingPrint({ areaId, orderIds }: { areaId: string; orderIds: string[] }) {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { orderRepository.list().then(setOrders); }, []);

  const chosen = useMemo(() => orders.filter((order) => {
    const pending = !["COMPLETED", "CANCELLED"].includes(order.status) && order.items.some((item) => pendingQuantity(item) > 0);
    if (!pending) return false;
    if (orderIds.length) return orderIds.includes(order.id);
    return Boolean(areaId) && order.masterAreaId === areaId;
  }), [orders, areaId, orderIds]);

  const areaNames = [...new Set(chosen.map((order) => order.masterAreaName))];
  const heading = areaNames.length === 1 ? areaNames[0] : areaNames.length > 1 ? "Multiple Master Areas" : "Pending Orders";

  return <div className="consolidated-pending-print mx-auto max-w-[210mm] bg-white p-5 print:max-w-none print:p-0">
    <div className="mb-4 flex justify-between print:hidden"><Link href="/orders" className="font-semibold text-blue-700">← Order Review</Link><button onClick={() => window.print()} className="rounded bg-slate-900 px-5 py-2 font-semibold text-white">Print A4</button></div>
    <header className="border-b-2 border-black pb-2 text-center"><h1 className="text-xl font-bold">Matariya Surat OMS</h1><p className="text-sm font-semibold">Consolidated Pending Orders · {heading}</p><p className="text-[10px]">{new Date().toLocaleDateString("en-IN")} · {chosen.length} parties</p></header>
    {chosen.map((order) => <section key={order.id} className="consolidated-order border-b border-black py-2">
      <div className="flex items-center justify-between gap-3 text-xs"><h2 className="text-sm font-bold">{order.dealerName}</h2><span className="rounded border border-black px-1.5 py-0.5 font-semibold">{order.masterAreaName}</span><strong>{order.orderNumber}</strong></div>
      <table className="mt-1 w-full table-fixed border-collapse text-[10px] leading-tight"><thead><tr className="border-y border-black text-left"><th className="w-[8%] border-x border-black py-1 text-center">Packed</th><th className="w-[30%] border-r border-black px-1 py-1">Item</th><th className="w-[13%] border-r border-black px-1 py-1 text-right">Pending Qty</th><th className="w-[16%] border-r border-black px-1 py-1 text-center">Dispatched Qty</th><th className="w-[33%] border-r border-black px-1 py-1">Remarks</th></tr></thead><tbody>{order.items.filter((item) => pendingQuantity(item) > 0).map((item) => <tr key={item.id} className="border-b border-black"><td className="h-7 border-x border-black"></td><td className="break-words border-r border-black px-1 py-1">{orderItemDisplayName(item)}</td><td className="border-r border-black px-1 py-1 text-right font-bold">{pendingQuantity(item)}</td><td className="h-7 border-r border-black px-1 py-1"></td><td className="break-words border-r border-black px-1 py-1">{item.remarks || "—"}</td></tr>)}</tbody></table>
    </section>)}
    {!chosen.length && <p className="p-10 text-center">No pending orders selected.</p>}
  </div>;
}
