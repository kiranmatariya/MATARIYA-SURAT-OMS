"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dealer } from "@/types/dealer";
import type { Order } from "@/types/order";
import { pendingQuantity } from "@/types/order";
import { dealerRepository } from "@/features/repositories";
import { orderRepository } from "@/features/repositories";
import { formatDate, orderItemDisplayName } from "./order-list";

export function PendingPackingList({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null | undefined>(); const [dealer, setDealer] = useState<Dealer | null>(null);
  useEffect(() => { (async () => { const value = await orderRepository.getById(orderId); setOrder(value); if (value) setDealer(await dealerRepository.getById(value.dealerId)); })(); }, [orderId]);
  if (order === undefined) return <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Preparing pending packing list…</div>;
  if (!order) return <div className="rounded-xl border bg-white p-10 text-center">Running order not found.</div>;
  const pendingItems = order.items.filter((item) => pendingQuantity(item) > 0); const total = pendingItems.reduce((sum, item) => sum + pendingQuantity(item), 0);
  return <div className="pending-pack-preview mx-auto"><div className="mb-5 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between"><Link href={`/orders/${order.id}`} className="text-sm font-semibold text-slate-600">← Back to Running Order</Link><button onClick={() => window.print()} className="h-11 w-full rounded-lg bg-slate-950 px-6 text-sm font-bold text-white sm:w-auto">Print Pending Packing List</button></div>
    <article className="pending-pack-page bg-white text-black"><header className="border-2 border-black"><div className="grid grid-cols-2 text-[10px] leading-tight"><HeaderField label="Party Name" value={order.dealerName} prominent/><HeaderField label="City" value={order.dealerCity || "—"} borderLeft/><HeaderField label="Order Date" value={formatDate(order.orderDate)}/><HeaderField label="Transport" value={dealer?.transport || "—"} borderLeft/><HeaderField label="Booking Center" value={dealer?.bookingCenter || "—"} full/></div></header>
      {order.remarks && <section className="mt-2 min-h-10 border-2 border-black bg-white p-1.5 text-[10px] leading-tight"><strong className="uppercase">Order Note / Packing Instructions:</strong><span className="ml-2 whitespace-pre-wrap font-black">{order.remarks}</span></section>}
      <table className="pending-pack-table mt-2 w-full table-fixed border-collapse text-[10px] leading-tight"><thead><tr><th aria-label="Packed tick" className="w-[8%] border-2 border-black p-1 text-center">Packed</th><th className="w-[37%] border-2 border-black p-1 text-left">Product Name</th><th className="w-[13%] border-2 border-black p-1 text-right">Pending Qty</th><th className="w-[16%] border-2 border-black p-1 text-center">Dispatched Qty</th><th className="w-[26%] border-2 border-black p-1 text-left">Remark</th></tr></thead><tbody>{pendingItems.length === 0 ? <tr><td colSpan={5} className="border-2 border-black p-6 text-center font-bold">NO PENDING ITEMS</td></tr> : pendingItems.map((item) => <tr key={item.id}><td className="h-7 border border-black p-1"></td><td className="border border-black p-1 font-bold">{orderItemDisplayName(item)}</td><td className="border border-black p-1 text-right text-[12px] font-black">{pendingQuantity(item).toLocaleString("en-IN")}</td><td className="h-7 border border-black p-1"></td><td className="border border-black p-1">{item.remarks || ""}</td></tr>)}</tbody><tfoot><tr><td className="border-2 border-black"></td><td className="border-2 border-black p-1 text-right font-black">TOTAL PENDING</td><td className="border-2 border-black p-1 text-right text-[12px] font-black">{total.toLocaleString("en-IN")}</td><td className="border-2 border-black"></td><td className="border-2 border-black"></td></tr></tfoot></table>
      <section className="pending-pack-signoff mt-4 grid grid-cols-2 gap-5 text-[10px]"><WriteLine label="No. of Cartons"/><WriteLine label="Packed By"/></section>
    </article></div>;
}
function HeaderField({ label, value, borderLeft = false, full = false, prominent = false }: { label: string; value: string; borderLeft?: boolean; full?: boolean; prominent?: boolean }) { return <div className={`${full ? "col-span-2" : ""} ${borderLeft ? "border-l-2" : ""} border-b-2 border-black p-1.5 last:border-b-0`}><p className="text-[7px] font-bold uppercase">{label}</p><p className={`font-black uppercase ${prominent ? "text-[14px]" : "text-[10px]"}`}>{value}</p></div>; }
function WriteLine({ label }: { label: string }) { return <div className="flex items-end gap-1"><strong className="whitespace-nowrap">{label}:</strong><span className="h-4 flex-1 border-b border-black"></span></div>; }
