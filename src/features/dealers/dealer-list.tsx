"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { dealerRepository } from "@/features/repositories";
import type { Dealer, DealerStatus } from "@/types/dealer";

type StatusFilter = "ALL" | DealerStatus;

export function DealerList() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealerRepository.list().then((items) => { setDealers(items); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dealers.filter((dealer) => {
      const matchesStatus = status === "ALL" || dealer.status === status;
      const matchesSearch = !term || [dealer.name, dealer.masterAreaName, dealer.city, dealer.mobileNumber, dealer.gstNumber].some((value) => value.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [dealers, search, status]);

  const activeCount = dealers.filter((dealer) => dealer.status === "ACTIVE").length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Master Data</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Dealer Master</h1>
          <p className="mt-2 text-sm text-slate-600">Manage dealer contact, GST and transport details.</p>
        </div>
        <Link href="/dealers/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">
          <span className="text-xl leading-none">+</span> Add New Dealer
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Total Dealers</p><p className="mt-1 text-3xl font-bold text-slate-950">{dealers.length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Active Dealers</p><p className="mt-1 text-3xl font-bold text-emerald-700">{activeCount}</p></div>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search dealers</span>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, city, mobile or GST number" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-11 min-w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Dealer Name</th><th className="px-5 py-3">Master Area</th><th className="px-5 py-3">Mobile</th><th className="px-5 py-3">GST Number</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Loading dealers…</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center"><p className="font-semibold text-slate-700">No dealers found</p><p className="mt-1 text-slate-500">Try a different search or status filter.</p></td></tr> : filtered.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-slate-50/80"><td className="px-5 py-4 font-semibold text-slate-900">{dealer.name}</td><td className="px-5 py-4 text-slate-600">{dealer.masterAreaName}</td><td className="px-5 py-4 text-slate-600">{dealer.mobileNumber || "—"}</td><td className="px-5 py-4 font-mono text-xs text-slate-600">{dealer.gstNumber || "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${dealer.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>{dealer.status === "ACTIVE" ? "Active" : "Inactive"}</span></td><td className="px-5 py-4 text-right"><Link href={`/dealers/${dealer.id}/edit`} className="font-semibold text-blue-700 hover:text-blue-900">Edit</Link></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">Showing {filtered.length} of {dealers.length} dealers</div>
      </section>
    </div>
  );
}
