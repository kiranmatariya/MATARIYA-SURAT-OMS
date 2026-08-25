"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { areaRepository, dealerRepository } from "@/features/repositories";
import type { DealerInput, MasterArea } from "@/types/dealer";

const emptyDealer: DealerInput = { name: "", mobileNumber: "", alternateMobileNumber: "", city: "Surat", state: "Gujarat", gstNumber: "", remarks: "", status: "ACTIVE", transport: "", bookingCenter: "", masterAreaId: "" };

const fieldClass = "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function DealerForm({ dealerId }: { dealerId?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<DealerInput>(emptyDealer);
  const [loading, setLoading] = useState(Boolean(dealerId));
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [nameError, setNameError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [areas, setAreas] = useState<MasterArea[]>([]);
  useEffect(() => { areaRepository.list().then(setAreas); }, []);

  useEffect(() => {
    if (!dealerId) return;
    dealerRepository.getById(dealerId).then((dealer) => {
      if (!dealer) setNotFound(true);
      else setValues({ name: dealer.name, mobileNumber: dealer.mobileNumber, alternateMobileNumber: dealer.alternateMobileNumber, city: dealer.city, state: dealer.state, gstNumber: dealer.gstNumber, remarks: dealer.remarks, status: dealer.status, transport: dealer.transport, bookingCenter: dealer.bookingCenter, masterAreaId: dealer.masterAreaId });
      setLoading(false);
    });
  }, [dealerId]);

  function setField<K extends keyof DealerInput>(field: K, value: DealerInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === "name" && String(value).trim()) setNameError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    const cleaned = { ...values, name: values.name.trim(), gstNumber: values.gstNumber.trim().toUpperCase() };
    if (!cleaned.name) { setNameError("Dealer Name is required."); return; }
    if (!cleaned.masterAreaId) { setNameError("Select a Master Area for this dealer."); return; }
    savingRef.current = true; setSaving(true);
    try { if (dealerId) await dealerRepository.update(dealerId, cleaned); else await dealerRepository.create(cleaned); router.push("/dealers"); }
    catch { savingRef.current = false; setSaving(false); setNameError("Could not save dealer. Please try again."); }
  }

  if (loading) return <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading dealer…</div>;
  if (notFound) return <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-white p-10 text-center"><h1 className="text-xl font-bold text-slate-900">Dealer not found</h1><Link href="/dealers" className="mt-4 inline-block font-semibold text-blue-700">Return to Dealer Master</Link></div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6"><Link href="/dealers" className="text-sm font-semibold text-slate-600 hover:text-blue-700">← Back to Dealers</Link><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{dealerId ? "Edit Dealer" : "Add New Dealer"}</h1><p className="mt-2 text-sm text-slate-600">Fields marked with <span className="text-red-600">*</span> are required.</p></div>
      <form onSubmit={handleSubmit} noValidate className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold text-slate-900">Dealer Information</h2><p className="mt-1 text-sm text-slate-500">Enter the dealer’s contact and business details.</p></div>
        <div className="grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-700">Dealer Name <span className="text-red-600">*</span></span><input autoFocus value={values.name} onChange={(e) => setField("name", e.target.value)} aria-invalid={Boolean(nameError)} aria-describedby="dealer-name-error" className={`${fieldClass} ${nameError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`} placeholder="Enter dealer or distributor name" />{nameError && <span id="dealer-name-error" className="mt-1.5 block text-xs font-medium text-red-600">{nameError}</span>}</label>
          <Field label="Mobile Number" value={values.mobileNumber} onChange={(v) => setField("mobileNumber", v)} placeholder="e.g. 98765 43210" inputMode="tel" />
          <Field label="Alternate Mobile Number" value={values.alternateMobileNumber} onChange={(v) => setField("alternateMobileNumber", v)} placeholder="Optional alternate number" inputMode="tel" />
          <Field label="City" value={values.city} onChange={(v) => setField("city", v)} placeholder="Enter city" />
          <label><span className="text-sm font-semibold text-slate-700">Master Area <span className="text-red-600">*</span></span><select value={values.masterAreaId} onChange={e=>setField("masterAreaId",e.target.value)} className={fieldClass}><option value="">Select Master Area</option>{areas.filter(a=>a.status==="ACTIVE"||a.id===values.masterAreaId).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><span className="mt-1.5 block text-xs text-slate-500">Changing this does not alter past transactions.</span></label>
          <Field label="State" value={values.state} onChange={(v) => setField("state", v)} placeholder="Enter state" />
          <label><span className="text-sm font-semibold text-slate-700">Status</span><select value={values.status} onChange={(e) => setField("status", e.target.value as DealerInput["status"])} className={fieldClass}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><span className="mt-1.5 block text-xs text-slate-500">Inactive dealers remain in history.</span></label>
          <label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-700">Remarks</span><textarea value={values.remarks} onChange={(e) => setField("remarks", e.target.value)} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="Any useful notes about this dealer" /></label>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end"><Link href="/dealers" className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</Link><button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : dealerId ? "Save Changes" : "Save Dealer"}</button></div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; inputMode?: "tel" }) {
  return <label><span className="text-sm font-semibold text-slate-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className={fieldClass} /></label>;
}
