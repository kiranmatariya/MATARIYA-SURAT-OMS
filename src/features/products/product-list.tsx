"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product, RecordStatus } from "@/types/product";
import { productRepository } from "@/features/repositories";
import { authClient } from "@/lib/auth-client";

type StatusFilter = "ALL" | RecordStatus;

export function ProductList() {
  const { data: session } = authClient.useSession(); const isAdmin = session?.user.role === "ADMIN";
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => { productRepository.list().then((items) => { setProducts(items); setLoading(false); }); }, []);
  const categories = useMemo(() => Array.from(new Set(products.map((item) => item.category).filter(Boolean))).sort(), [products]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => (!term || product.name.toLowerCase().includes(term) || product.code.toLowerCase().includes(term)) && (category === "ALL" || product.category === category) && (status === "ALL" || product.status === status));
  }, [products, search, category, status]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Master Data</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Product Master</h1><p className="mt-2 text-sm text-slate-600">Manage standard products and Fan Rod options.</p></div>
        {isAdmin && <div className="flex flex-wrap gap-3"><Link href="/products/fan-rod/sizes" className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Fan Rod Settings</Link><Link href="/products/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><span className="text-xl">+</span> Add Product</Link></div>}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Summary label="Total Products" value={products.length} />
        <Summary label="Active Products" value={products.filter((item) => item.status === "ACTIVE").length} colour="text-emerald-700" />
        <Summary label="Fan Rod Structure" value="1 × options" small />
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_190px_170px]">
          <label><span className="sr-only">Search products</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product name or code" className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
          <label><span className="sr-only">Filter by category</span><select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="ALL">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Filter by status</span><select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Product Name</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Unit</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">
          {loading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">Loading products…</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">No products match these filters.</td></tr> : filtered.map((product) => <tr key={product.id} className="hover:bg-slate-50/80"><td className="px-5 py-4 font-semibold text-slate-900">{product.name}</td><td className="px-5 py-4 font-mono text-xs text-slate-600">{product.code || "—"}</td><td className="px-5 py-4 text-slate-600">{product.category || "—"}</td><td className="px-5 py-4 text-slate-600">{product.unit || "—"}</td><td className="px-5 py-4"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${product.type === "FAN_ROD" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{product.type === "FAN_ROD" ? "Fan Rod" : "Normal"}</span></td><td className="px-5 py-4"><StatusBadge status={product.status}/></td><td className="px-5 py-4 text-right">{isAdmin ? <Link href={`/products/${product.id}/edit`} className="font-semibold text-blue-700 hover:text-blue-900">Edit</Link> : <span className="text-slate-400">View only</span>}</td></tr>)}
        </tbody></table></div><div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">Showing {filtered.length} of {products.length} products</div>
      </section>
    </div>
  );
}

function Summary({ label, value, colour = "text-slate-950", small = false }: { label: string; value: string | number; colour?: string; small?: boolean }) { return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-1 font-bold ${small ? "text-xl" : "text-3xl"} ${colour}`}>{value}</p></div>; }
export function StatusBadge({ status }: { status: RecordStatus }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>{status === "ACTIVE" ? "Active" : "Inactive"}</span>; }
