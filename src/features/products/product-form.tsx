"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ProductInput } from "@/types/product";
import { productCategoryRepository, productRepository } from "@/features/repositories";

const emptyProduct: ProductInput = { name: "", code: "", category: "", unit: "PCS", weightPerPieceKg: 0, remarks: "", status: "ACTIVE", type: "NORMAL" };
const fieldClass = "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<ProductInput>(emptyProduct);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => { if (!productId) return; productRepository.getById(productId).then((product) => { if (!product) setNotFound(true); else setValues({ name: product.name, code: product.code, category: product.category, unit: product.unit, weightPerPieceKg: product.weightPerPieceKg ?? 0, remarks: product.remarks, status: product.status, type: product.type }); setLoading(false); }); }, [productId]);
  useEffect(() => { productCategoryRepository.list().then((categories) => setCategoryOptions(categories.filter((category) => category.status === "ACTIVE" || category.name === values.category).map((category) => category.name))); }, [values.category]);
  function setField<K extends keyof ProductInput>(field: K, value: ProductInput[K]) { setValues((current) => ({ ...current, [field]: value })); if (field === "name") setError(""); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (savingRef.current) return; const cleaned = { ...values, name: values.name.trim(), code: values.code.trim().toUpperCase(), category: values.category.trim(), unit: values.unit.trim().toUpperCase(), weightPerPieceKg: 0 }; if (!cleaned.name) { setError("Product Name is required."); return; } savingRef.current = true; setSaving(true); try { if (productId) await productRepository.update(productId, cleaned); else await productRepository.create(cleaned); router.push("/products"); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save product."); savingRef.current = false; setSaving(false); } }
  if (loading) return <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading product…</div>;
  if (notFound) return <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-white p-10 text-center"><h1 className="text-xl font-bold">Product not found</h1><Link href="/products" className="mt-4 inline-block font-semibold text-blue-700">Return to Product Master</Link></div>;
  return <div className="mx-auto max-w-5xl"><div className="mb-6"><Link href="/products" className="text-sm font-semibold text-slate-600 hover:text-blue-700">← Back to Products</Link><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{productId ? "Edit Product" : "Add Product"}</h1><p className="mt-2 text-sm text-slate-600">Create a standard item or the single Fan Rod product.</p></div>
    <form onSubmit={submit} noValidate className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold text-slate-900">Product Information</h2><p className="mt-1 text-sm text-slate-500">Fan Rod sizes, colours and gauges are managed separately.</p></div><div className="grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2">
      <label><span className="text-sm font-semibold text-slate-700">Product Type</span><select value={values.type} onChange={(e) => { const type = e.target.value as ProductInput["type"]; setValues((current) => ({ ...current, type, ...(type === "FAN_ROD" && !current.name ? { name: "Fan Rod", category: "Fan Accessories", unit: "PCS" } : {}) })); }} className={fieldClass}><option value="NORMAL">Normal Product</option><option value="FAN_ROD">Fan Rod Product</option></select></label>
      <label><span className="text-sm font-semibold text-slate-700">Status</span><select value={values.status} onChange={(e) => setField("status", e.target.value as ProductInput["status"])} className={fieldClass}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      <label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-700">Product Name <span className="text-red-600">*</span></span><input autoFocus value={values.name} onChange={(e) => setField("name", e.target.value)} className={`${fieldClass} ${error ? "border-red-500" : ""}`} placeholder="e.g. RCCB" />{error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}</label>
      <Field label="Product Code / SKU" value={values.code} onChange={(value) => setField("code", value.toUpperCase())} placeholder="e.g. RCCB-01"/><label><span className="text-sm font-semibold text-slate-700">Category</span><select value={values.category} onChange={(event) => setField("category", event.target.value)} className={fieldClass}><option value="">Select category</option>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><Field label="Unit" value={values.unit} onChange={(value) => setField("unit", value.toUpperCase())} placeholder="PCS, SET, BOX, etc."/>
      {values.type === "FAN_ROD" && <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800"><strong className="block">One product, flexible variants</strong><span className="mt-1 block leading-5">Orders will later combine this product with a gauge, size and colour.</span></div>}
      <label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-700">Remarks</span><textarea value={values.remarks} onChange={(e) => setField("remarks", e.target.value)} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="Optional product notes"/></label>
    </div><div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end"><Link href="/products" className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</Link><button disabled={saving} className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving…" : productId ? "Save Changes" : "Save Product"}</button></div></form>
  </div>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label><span className="text-sm font-semibold text-slate-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} placeholder={placeholder}/></label>; }
