"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { FanRodOption, FanRodOptionInput, FanRodOptionKind } from "@/types/product";
import { fanRodOptionRepository } from "@/features/repositories";
import { StatusBadge } from "./product-list";

const labels = {
  SIZE: { title: "Fan Rod Sizes", singular: "Size", help: "Manage the available Fan Rod lengths." },
  COLOUR: { title: "Fan Rod Colours", singular: "Colour", help: "Manage the available Fan Rod colours." },
  GAUGE: { title: "Fan Rod Gauges / Qualities", singular: "Gauge / Quality", help: "Manage material gauge or quality choices." },
} as const;

const emptyInput: FanRodOptionInput = { name: "", code: "", status: "ACTIVE" };

export function FanRodOptionManager({ kind }: { kind: FanRodOptionKind }) {
  const copy = labels[kind];
  const [items, setItems] = useState<FanRodOption[]>([]);
  const [values, setValues] = useState<FanRodOptionInput>(emptyInput);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function refresh() { setItems(await fanRodOptionRepository.list(kind)); }
  useEffect(() => { fanRodOptionRepository.list(kind).then(setItems); }, [kind]);

  function edit(item: FanRodOption) { setEditingId(item.id); setValues({ name: item.name, code: item.code, status: item.status }); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function cancel() { setEditingId(null); setValues(emptyInput); setError(""); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const cleaned = { ...values, name: values.name.trim(), code: values.code.trim().toUpperCase() }; if (!cleaned.name) { setError(`${copy.singular} name is required.`); return; } if (editingId) await fanRodOptionRepository.update(editingId, cleaned); else await fanRodOptionRepository.create(kind, cleaned); cancel(); await refresh(); }
  async function toggle(item: FanRodOption) { await fanRodOptionRepository.update(item.id, { name: item.name, code: item.code, status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }); await refresh(); }

  return <div className="mx-auto max-w-6xl"><div className="mb-6"><Link href="/products" className="text-sm font-semibold text-slate-600 hover:text-blue-700">← Back to Products</Link><p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">Fan Rod Settings</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{copy.title}</h1><p className="mt-2 text-sm text-slate-600">{copy.help} Inactive options remain available for historical records.</p></div>
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><Tab href="/products/fan-rod/sizes" active={kind === "SIZE"}>Sizes</Tab><Tab href="/products/fan-rod/colours" active={kind === "COLOUR"}>Colours</Tab><Tab href="/products/fan-rod/gauges" active={kind === "GAUGE"}>Gauges / Qualities</Tab></div>
    <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={submit} noValidate className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">{editingId ? `Edit ${copy.singular}` : `Add ${copy.singular}`}</h2></div><div className="space-y-4 p-5"><label className="block"><span className="text-sm font-semibold text-slate-700">{copy.singular} Name <span className="text-red-600">*</span></span><input value={values.name} onChange={(e) => { setValues((current) => ({ ...current, name: e.target.value })); setError(""); }} placeholder={kind === "SIZE" ? "e.g. 72 inch" : kind === "COLOUR" ? "e.g. Copper" : "e.g. Extra Heavy"} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>{error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}</label><label className="block"><span className="text-sm font-semibold text-slate-700">Short Code</span><input value={values.code} onChange={(e) => setValues((current) => ({ ...current, code: e.target.value.toUpperCase() }))} placeholder="Optional code" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/></label><label className="block"><span className="text-sm font-semibold text-slate-700">Status</span><select value={values.status} onChange={(e) => setValues((current) => ({ ...current, status: e.target.value as FanRodOptionInput["status"] }))} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-4">{editingId && <button type="button" onClick={cancel} className="h-10 flex-1 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700">Cancel</button>}<button className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">{editingId ? "Save Changes" : `Add ${copy.singular}`}</button></div></form>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Current {copy.title.replace("Fan Rod ", "")}</h2><p className="mt-1 text-xs text-slate-500">{items.length} records</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="px-5 py-4 font-semibold text-slate-900">{item.name}</td><td className="px-5 py-4 font-mono text-xs text-slate-600">{item.code || "—"}</td><td className="px-5 py-4"><StatusBadge status={item.status}/></td><td className="px-5 py-4 text-right"><button onClick={() => edit(item)} className="font-semibold text-blue-700 hover:text-blue-900">Edit</button><span className="mx-2 text-slate-300">|</span><button onClick={() => toggle(item)} className="font-semibold text-slate-600 hover:text-slate-900">{item.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) { return <Link href={href} className={`rounded-lg px-4 py-2 text-sm font-semibold ${active ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{children}</Link>; }
