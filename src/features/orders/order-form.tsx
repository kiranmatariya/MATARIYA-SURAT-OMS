"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { SearchSelect } from "@/components/search-select";
import type { Dealer } from "@/types/dealer";
import type { Order, OrderInput, OrderItem } from "@/types/order";
import { pendingQuantity } from "@/types/order";
import type { FanRodOption, Product } from "@/types/product";
import { dealerRepository, fanRodOptionRepository, orderRepository, productRepository } from "@/features/repositories";

const today = () => new Date().toISOString().slice(0, 10);
const fieldClass = "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function blankItem(): OrderItem {
  return { id: crypto.randomUUID(), productId: "", productName: "", productCode: "", productType: "NORMAL", fanRodVariant: null, orderedQty: 1, dispatchedQty: 0, cancelledQty: 0, remarks: "" };
}
function blankItems(count: number) {
  return Array.from({ length: count }, blankItem);
}

export function OrderForm({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("Generating…");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<FanRodOption[]>([]);
  const [colours, setColours] = useState<FanRodOption[]>([]);
  const [gauges, setGauges] = useState<FanRodOption[]>([]);
  const [dealerId, setDealerId] = useState("");
  const [orderDate, setOrderDate] = useState(today());
  const [customerReference, setCustomerReference] = useState("");
  const [expectedDispatchDate, setExpectedDispatchDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<OrderItem[]>(() => blankItems(10));
  const [existingLines, setExistingLines] = useState<Record<string, { pending: number; ordered: number; processed: boolean }>>({});
  const [duplicateOrder, setDuplicateOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      dealerRepository.list(),
      productRepository.list(),
      fanRodOptionRepository.list("SIZE"),
      fanRodOptionRepository.list("COLOUR"),
      fanRodOptionRepository.list("GAUGE"),
      orderId ? orderRepository.getById(orderId) : null,
      orderRepository.nextOrderNumber(),
    ]).then(([dealerList, productList, sizeList, colourList, gaugeList, existing, nextNumber]) => {
      setDealers(dealerList.filter((item) => item.status === "ACTIVE"));
      setProducts(productList.filter((item) => item.status === "ACTIVE"));
      setSizes(sizeList.filter((item) => item.status === "ACTIVE"));
      setColours(colourList.filter((item) => item.status === "ACTIVE"));
      setGauges(gaugeList.filter((item) => item.status === "ACTIVE"));
      if (orderId && existing) {
        const pendingSource = existing.items.filter((item) => pendingQuantity(item) > 0);
        const pendingItems = pendingSource.map((item) => ({ ...item, orderedQty: 0 }));
        setExistingLines(Object.fromEntries(pendingSource.map((item) => [item.id, {
          pending: pendingQuantity(item), ordered: item.orderedQty,
          processed: item.dispatchedQty > 0 || item.cancelledQty > 0,
        }])));
        setOrderNumber(existing.orderNumber);
        setDealerId(existing.dealerId);
        setOrderDate(existing.orderDate);
        setCustomerReference(existing.customerReference);
        setExpectedDispatchDate(existing.expectedDispatchDate);
        setRemarks(existing.remarks);
        setItems([...pendingItems, ...blankItems(Math.max(0, 10 - pendingItems.length))]);
        if (existing.status === "COMPLETED" || existing.status === "CANCELLED") setErrors(["Completed or cancelled orders cannot be edited."]);
      } else setOrderNumber(nextNumber);
      setLoading(false);
    });
  }, [orderId]);

  const dealerOptions = useMemo(
    () => dealers.map((dealer) => ({ value: dealer.id, label: dealer.name, detail: [dealer.city, dealer.mobileNumber].filter(Boolean).join(" · ") })),
    [dealers],
  );
  const fanRodVariantOptions = useMemo(() => sizes.flatMap((size) => colours.flatMap((colour) => gauges.map((gauge) => ({
    value: `${gauge.id}::${size.id}::${colour.id}`,
    label: `${size.name} ${colour.name} ${gauge.name}`,
    detail: "Size / Colour / Quality",
  })))), [sizes, colours, gauges]);
  const productOptions = useMemo(
    () => products.flatMap((product) => product.type === "FAN_ROD" ? [
      { value: product.id, label: product.name, detail: "Fan Rod — choose combination in the next field" },
      ...fanRodVariantOptions.map((variant) => ({
        value: `FAN_ROD_VARIANT::${product.id}::${variant.value}`,
        label: `${product.name} — ${variant.label}`,
        detail: "Complete Fan Rod combination",
      })),
    ] : [{
      value: product.id,
      label: `${product.name}${product.code ? ` (${product.code})` : ""}`,
      detail: product.category || "Normal",
    }]),
    [products, fanRodVariantOptions],
  );

  function updateItem(id: string, update: Partial<OrderItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }
  async function chooseDealer(id: string) {
    const dealer = dealers.find((entry) => entry.id === id);
    setDealerId(id);
    setDuplicateOrder(dealer ? await orderRepository.findCurrentByDealer(dealer.id, orderId) : null);
  }
  function chooseProduct(itemId: string, selectedValue: string) {
    const directVariant = selectedValue.startsWith("FAN_ROD_VARIANT::");
    const rowIndex = items.findIndex((item) => item.id === itemId);
    const [, variantProductId = "", gaugeId = "", sizeId = "", colourId = ""] = directVariant ? selectedValue.split("::") : [];
    const productId = directVariant ? variantProductId : selectedValue;
    const product = products.find((entry) => entry.id === productId);
    if (!product) {
      updateItem(itemId, { productId: "", productName: "", productCode: "", productType: "NORMAL", fanRodVariant: null });
      return;
    }
    updateItem(itemId, {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      productType: product.type,
      fanRodVariant: product.type === "FAN_ROD" ? {
        gaugeId, gaugeName: gauges.find((entry) => entry.id === gaugeId)?.name ?? "",
        sizeId, sizeName: sizes.find((entry) => entry.id === sizeId)?.name ?? "",
        colourId, colourName: colours.find((entry) => entry.id === colourId)?.name ?? "",
      } : null,
    });
    if (directVariant && rowIndex >= 0) window.setTimeout(() => document.getElementById(`order-quantity-${rowIndex}`)?.focus(), 0);
  }
  function chooseFanRodVariant(item: OrderItem, value: string) {
    const [gaugeId = "", sizeId = "", colourId = ""] = value.split("::");
    updateItem(item.id, { fanRodVariant: {
      gaugeId, gaugeName: gauges.find((entry) => entry.id === gaugeId)?.name ?? "",
      sizeId, sizeName: sizes.find((entry) => entry.id === sizeId)?.name ?? "",
      colourId, colourName: colours.find((entry) => entry.id === colourId)?.name ?? "",
    } });
  }
  function enteredItems() {
    return items.filter((item) => item.productId || item.productName.trim() || item.remarks.trim());
  }
  function validate(activeItems: OrderItem[]) {
    const problems: string[] = [];
    if (!dealerId || !dealers.some((dealer) => dealer.id === dealerId)) problems.push("Select a dealer from the Dealer Master list.");
    if (duplicateOrder) problems.push(`${duplicateOrder.dealerName} already has current order ${duplicateOrder.orderNumber}.`);
    if (activeItems.length === 0) problems.push("Enter at least one order item.");
    activeItems.forEach((item) => {
      const index = items.findIndex((entry) => entry.id === item.id);
      if (!item.productId) problems.push(`Line ${index + 1}: select a valid product.`);
      const existingLine = existingLines[item.id];
      if (!Number.isFinite(item.orderedQty) || item.orderedQty < 0 || (!existingLine && item.orderedQty === 0)) problems.push(`Line ${index + 1}: new order quantity must be greater than zero.`);
      if (item.productType === "FAN_ROD" && (!item.fanRodVariant?.gaugeId || !item.fanRodVariant.sizeId || !item.fanRodVariant.colourId)) problems.push(`Line ${index + 1}: select gauge, size and colour for Fan Rod.`);
    });
    setErrors(problems);
    return problems.length === 0;
  }
  function addRows(count: number) {
    setItems((current) => [...current, ...blankItems(count)]);
  }
  function moveToNextLine(index: number) {
    if (index === items.length - 1) addRows(5);
    window.setTimeout(() => document.getElementById(`order-product-${index + 1}`)?.focus(), 0);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    const activeItems = enteredItems();
    if (!validate(activeItems)) return;
    const dealer = dealers.find((entry) => entry.id === dealerId)!;
    const storedItems = orderId ? activeItems.map((item) => ({ ...item, orderedQty: (existingLines[item.id]?.ordered ?? 0) + item.orderedQty })) : activeItems;
    const input: OrderInput = {
      orderDate,
      dealerId: dealer.id,
      dealerName: dealer.name,
      dealerCity: dealer.city,
      dealerMobileNumber: dealer.mobileNumber,
      dealerGstNumber: dealer.gstNumber,
      masterAreaId: dealer.masterAreaId,
      masterAreaName: dealer.masterAreaName,
      customerReference: customerReference.trim(),
      expectedDispatchDate,
      remarks: remarks.trim(),
      items: storedItems,
    };
    savingRef.current = true;
    setSaving(true);
    try {
      const saved = orderId ? await orderRepository.updateCurrent(orderId, input) : await orderRepository.createDraft(input);
      router.push(`/orders/${saved.id}`);
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : "Could not save order."]);
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-7xl rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">Preparing order form…</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link href={orderId ? `/orders/${orderId}` : "/orders"} className="text-sm font-semibold text-slate-600 hover:text-blue-700">← Back to Orders</Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{orderId ? `Edit ${orderNumber}` : "Create New Order"}</h1>
        <p className="mt-2 text-sm text-slate-600">{orderId ? "Only pending lines are shown. Fully dispatched lines remain safely in history and are hidden here." : "Add standard products and Fan Rod combinations to the same order."}</p>
      </div>
      <form onSubmit={submit} noValidate className="space-y-6">
        {errors.length > 0 && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Please correct the following:</strong>
            <ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        )}
        <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold text-slate-900">Order Information</h2></div>
          <div className="grid gap-x-6 gap-y-5 p-6 md:grid-cols-2 xl:grid-cols-3">
            <ReadField label="Order Number" value={orderNumber} />
            <label><span className="text-sm font-semibold text-slate-700">Order Date</span><input type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={fieldClass} /></label>
            <div>
              <SearchSelect
                label={<>Dealer <span className="text-red-600">*</span></>}
                value={dealerId}
                options={dealerOptions}
                placeholder="Type to search dealer"
                invalid={Boolean(duplicateOrder)}
                onChange={(id) => void chooseDealer(id)}
              />
              {duplicateOrder && (
                <span className="mt-2 block rounded-md bg-amber-50 p-2 text-xs font-semibold text-amber-800">
                  This dealer already has <Link href={`/orders/${duplicateOrder.id}`} className="underline">{duplicateOrder.orderNumber}</Link>. Open that order instead.
                </span>
              )}
            </div>
            <label><span className="text-sm font-semibold text-slate-700">Customer PO / Reference</span><input value={customerReference} onChange={(e) => setCustomerReference(e.target.value)} placeholder="Optional reference number" className={fieldClass} /></label>
            <label><span className="text-sm font-semibold text-slate-700">Expected Dispatch Date</span><input type="date" value={expectedDispatchDate} onChange={(e) => setExpectedDispatchDate(e.target.value)} className={fieldClass} /></label>
            <label className="md:col-span-2 xl:col-span-1"><span className="text-sm font-semibold text-slate-700">Remarks / Order Note</span><textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Packing instructions or important order notes" className={`${fieldClass} h-auto min-h-20 resize-y py-2 leading-snug`} /></label>
          </div>
        </section>
        <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Fast Order Entry</h2>
              <p className="mt-1 text-sm text-slate-500">{orderId ? "Old Pending is shown separately. You may correct an untouched saved product; lines already dispatched or reduced stay locked. Enter fresh quantities in New Order Qty." : "10 lines are ready. Empty lines are ignored when saving."}</p>
            </div>
            <button type="button" onClick={() => addRows(5)} className="h-10 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100">+ Add 5 More Rows</button>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[1100px] table-fixed text-sm leading-tight">
              <thead className="sticky top-0 z-10 bg-slate-100 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="w-9 border-r border-slate-300 px-1 py-2 text-center">#</th>
                  <th className="w-[20%] border-r border-slate-300 px-2 py-2">Product</th>
                  <th className="w-[27%] border-r border-slate-300 px-2 py-2">Fan Rod — Size / Colour / Quality</th>
                  {orderId && <th className="w-20 border-r border-slate-300 bg-blue-50 px-2 py-2 text-right text-blue-800">Old Pending</th>}
                  <th className="w-24 border-r border-slate-300 px-2 py-2 text-right">{orderId ? "New Order Qty" : "Qty"}</th>
                  {orderId && <th className="w-20 border-r border-slate-300 bg-emerald-50 px-2 py-2 text-right text-emerald-800">Total Pending</th>}
                  <th className="w-[16%] border-r border-slate-300 px-2 py-2">Remarks / Packing</th>
                  <th className="w-16 px-1 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <OrderItemEditor
                    key={item.id}
                    item={item}
                    index={index}
                    existingLine={existingLines[item.id]}
                    showOldPending={Boolean(orderId)}
                    productOptions={productOptions}
                    fanRodVariantOptions={fanRodVariantOptions}
                    onProduct={chooseProduct}
                    onUpdate={updateItem}
                    onFanRodVariant={chooseFanRodVariant}
                    onRemove={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                    onNext={() => moveToNextLine(index)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">{items.length} line{items.length === 1 ? "" : "s"} · All quantities are entered without prices.</div>
        </section>
        <div className="flex flex-col-reverse gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
          <Link href={orderId ? `/orders/${orderId}` : "/orders"} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</Link>
          <button disabled={saving} className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-7 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving…" : orderId ? "Save Order Changes" : "Save as Draft"}</button>
        </div>
      </form>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return <label><span className="text-sm font-semibold text-slate-700">{label}</span><input readOnly value={value} className={`${fieldClass} cursor-default bg-slate-50 font-semibold text-slate-700`} /></label>;
}

function OrderItemEditor({
  item,
  index,
  existingLine,
  showOldPending,
  productOptions,
  fanRodVariantOptions,
  onProduct,
  onUpdate,
  onFanRodVariant,
  onRemove,
  onNext,
}: {
  item: OrderItem;
  index: number;
  existingLine?: { pending: number; ordered: number; processed: boolean };
  showOldPending: boolean;
  productOptions: { value: string; label: string; detail?: string }[];
  fanRodVariantOptions: { value: string; label: string; detail?: string }[];
  onProduct: (id: string, value: string) => void;
  onUpdate: (id: string, update: Partial<OrderItem>) => void;
  onFanRodVariant: (item: OrderItem, value: string) => void;
  onRemove: () => void;
  onNext: () => void;
}) {
  const compactClass = "h-9 w-full border-0 bg-transparent px-2 text-sm leading-tight text-slate-900 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500";
  return (
    <tr className="border-t border-slate-300 bg-white">
      <td className="border-r border-slate-300 px-2 text-center text-xs font-bold text-slate-500">{index + 1}</td>
      <td className="border-r border-slate-300">
        <SearchSelect
          id={`order-product-${index}`}
          value={item.productId}
          options={productOptions}
          placeholder="Type product name"
          aria-label={`Line ${index + 1} Product`}
          disabled={existingLine?.processed}
          compact
          onChange={(productId) => onProduct(item.id, productId)}
        />
      </td>
      <td className="border-r border-slate-300">
        {item.productType === "FAN_ROD" ? (
          <SearchSelect
            value={item.fanRodVariant ? `${item.fanRodVariant.gaugeId}::${item.fanRodVariant.sizeId}::${item.fanRodVariant.colourId}` : ""}
            options={fanRodVariantOptions}
            placeholder='Type size and colour, e.g. 15 W'
            aria-label={`Line ${index + 1} Fan Rod Size, Colour and Quality`}
            disabled={existingLine?.processed}
            compact
            onChange={(value) => onFanRodVariant(item, value)}
          />
        ) : <EmptyCell />}
      </td>
      {showOldPending && <td className="border-r border-slate-300 bg-blue-50 px-3 text-right text-lg font-black text-blue-900">{existingLine ? existingLine.pending.toLocaleString("en-IN") : "—"}</td>}
      <td className="border-r border-slate-300">
        <input id={`order-quantity-${index}`} aria-label={`Line ${index + 1} ${showOldPending ? "New Order Quantity" : "Quantity"}`} type="number" min={existingLine ? 0 : 1} step="1" value={item.orderedQty} onFocus={(event) => event.currentTarget.select()} onChange={(e) => onUpdate(item.id, { orderedQty: Number(e.target.value) })} className={`${compactClass} text-right text-lg font-bold`} />
      </td>
      {showOldPending && <td className="border-r border-slate-300 bg-emerald-50 px-3 text-right text-lg font-black text-emerald-900">{(item.orderedQty + (existingLine?.pending ?? 0)).toLocaleString("en-IN")}</td>}
      <td className="border-r border-slate-300">
        <input aria-label={`Line ${index + 1} Remarks`} value={item.remarks} onChange={(e) => onUpdate(item.id, { remarks: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onNext(); } }} placeholder="Packing or item notes" className={compactClass} />
      </td>
      <td className="text-center">{existingLine ? <span className={`text-[10px] font-bold uppercase ${existingLine.processed ? "text-amber-700" : "text-emerald-700"}`}>{existingLine.processed ? "History locked" : "Editable"}</span> : <button type="button" onClick={onRemove} className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>}</td>
    </tr>
  );
}

function EmptyCell() {
  return <span className="block px-3 text-center text-slate-300">—</span>;
}
