"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { areaRepository, orderRepository } from "@/features/repositories";
import type { MasterArea } from "@/types/dealer";
import type { Order, OrderItem, OrderStatus } from "@/types/order";
import { pendingQuantity } from "@/types/order";

type ReviewView = "ALL" | "AREA";

export const orderStatusLabels: Record<OrderStatus, string> = {
  DRAFT: "Draft", CONFIRMED: "Confirmed", PARTIALLY_DISPATCHED: "Partially Dispatched", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">{orderStatusLabels[status]}</span>;
}

export function orderItemDisplayName(item: OrderItem) {
  return item.fanRodVariant ? `${item.fanRodVariant.sizeName} · ${item.fanRodVariant.colourName} · ${item.fanRodVariant.gaugeName}` : item.productName;
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [areas, setAreas] = useState<MasterArea[]>([]);
  const [view, setView] = useState<ReviewView>("ALL");
  const [areaId, setAreaId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([orderRepository.list(), areaRepository.list()]).then(([orderRows, areaRows]) => {
      const activeAreas = areaRows.filter((area) => area.status === "ACTIVE");
      setOrders(orderRows);
      setAreas(activeAreas);
      setAreaId(activeAreas[0]?.id ?? "");
      setLoading(false);
    });
  }, []);

  const allPending = useMemo(() => orders.filter((order) =>
    !["COMPLETED", "CANCELLED"].includes(order.status) && order.items.some((item) => pendingQuantity(item) > 0)
  ), [orders]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allPending.filter((order) =>
      (view === "ALL" || order.masterAreaId === areaId) &&
      (!term || `${order.orderNumber} ${order.dealerName} ${order.masterAreaName}`.toLowerCase().includes(term))
    );
  }, [allPending, view, areaId, search]);

  const selectedVisible = visible.filter((order) => selected.includes(order.id));
  const selectedPrintHref = `/orders/area-print?orders=${selected.join(",")}`;
  const areaPrintHref = `/orders/area-print?area=${encodeURIComponent(areaId)}`;

  function changeView(next: ReviewView) { setView(next); }
  function changeArea(id: string) { setAreaId(id); }
  function selectAllVisible(checked: boolean) {
    const visibleIds = new Set(visible.map((order) => order.id));
    setSelected((current) => checked
      ? [...new Set([...current, ...visibleIds])]
      : current.filter((id) => !visibleIds.has(id))
    );
  }

  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-blue-700">Surat Orders</p><h1 className="mt-2 text-3xl font-bold">Order Review</h1><p className="mt-2 text-sm text-slate-600">Review all pending orders together or filter them Master Area-wise.</p></div>
      <Link href="/orders/new" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">+ Create New Order</Link>
    </div>

    <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <button onClick={() => changeView("ALL")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "ALL" ? "bg-slate-900 text-white" : "border bg-white"}`}>All Orders <span className="ml-1 opacity-70">({allPending.length})</span></button>
      <button onClick={() => changeView("AREA")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "AREA" ? "bg-slate-900 text-white" : "border bg-white"}`}>Master Area-wise</button>
    </div>

    {view === "AREA" && <div className="mt-3 flex flex-wrap gap-2">{areas.map((area) => {
      const count = allPending.filter((order) => order.masterAreaId === area.id).length;
      return <button key={area.id} onClick={() => changeArea(area.id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${area.id === areaId ? "bg-blue-600 text-white" : "border bg-white"}`}>{area.name} <span className="ml-1 opacity-70">({count})</span></button>;
    })}</div>}

    <div className="mt-4 flex flex-wrap items-center gap-3">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, dealer or Master Area" className="h-10 min-w-64 flex-1 rounded-lg border px-3" />
      <label className="flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold"><input type="checkbox" checked={visible.length > 0 && selectedVisible.length === visible.length} onChange={(event) => selectAllVisible(event.target.checked)} /> Select all shown</label>
      <Link href={selectedPrintHref} aria-disabled={!selected.length} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${selected.length ? "bg-slate-900" : "pointer-events-none bg-slate-400"}`}>Print Selected from Any Area ({selected.length})</Link>
      {view === "AREA" && <Link href={areaPrintHref} className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Print All in This Area</Link>}
    </div>

    <p className="mt-3 text-xs text-slate-500">Selections can include parties from different Master Areas. They will print together in one consolidated A4 print job.</p>
    <div className="mt-4 space-y-3">{loading ? <p className="rounded-xl border bg-white p-10 text-center">Loading orders…</p> : visible.length === 0 ? <p className="rounded-xl border bg-white p-10 text-center text-slate-500">No pending orders found.</p> : visible.map((order) => <Review key={order.id} order={order} selected={selected.includes(order.id)} onSelect={(checked) => setSelected((ids) => checked ? [...new Set([...ids, order.id])] : ids.filter((id) => id !== order.id))} />)}</div>
  </div>;
}

function Review({ order, selected, onSelect }: { order: Order; selected: boolean; onSelect: (value: boolean) => void }) {
  const items = order.items.filter((item) => pendingQuantity(item) > 0);
  return <article className="overflow-hidden rounded-xl border bg-white shadow-sm"><header className="flex flex-wrap items-center gap-3 border-b border-slate-300 bg-slate-200 p-3"><input aria-label={`Select ${order.dealerName}`} type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} /><strong>{order.dealerName}</strong><span className="mr-auto rounded bg-white/70 px-2 py-1 text-xs font-semibold text-slate-700">{order.masterAreaName}</span><span>{order.orderNumber}</span><OrderStatusBadge status={order.status} /><Link href={`/orders/${order.id}/packing-list`} className="font-semibold text-blue-700">Individual Print</Link><Link href={`/orders/${order.id}`} className="font-semibold text-blue-700">Open</Link></header><table className="w-full table-fixed text-sm"><thead><tr className="text-left text-xs uppercase text-slate-500"><th className="w-[38%] p-3">Pending Item</th><th className="w-[14%] p-3 text-right">Pending</th><th className="w-[48%] p-3">Remarks</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="break-words p-3 font-semibold">{orderItemDisplayName(item)}</td><td className="p-3 text-right font-bold text-blue-800">{pendingQuantity(item).toLocaleString("en-IN")}</td><td className="break-words p-3">{item.remarks || "—"}</td></tr>)}</tbody></table></article>;
}

export function formatDate(value: string) { return value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "—"; }
