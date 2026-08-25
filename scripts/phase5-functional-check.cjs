/* eslint-disable @typescript-eslint/no-require-imports, @next/next/no-assign-module-variable */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const memory = new Map();
global.window = { localStorage: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)) } };
global.crypto = webcrypto;
const cache = new Map();
function load(filename) {
  const resolved = filename.endsWith(".ts") ? filename : `${filename}.ts`;
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const module = { exports: {} }; cache.set(resolved, module);
  const source = fs.readFileSync(resolved, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const localRequire = (request) => request.startsWith("@/") ? load(path.join(root, "src", request.slice(2))) : request.startsWith(".") ? load(path.resolve(path.dirname(resolved), request)) : require(request);
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename: resolved })(localRequire, module, module.exports);
  return module.exports;
}

(async () => {
  const { localOrderRepository: orders } = load(path.join(root, "src/features/orders/local-order-repository"));
  const variant = { gaugeId: "g1", gaugeName: "1.2mm", sizeId: "s1", sizeName: "600mm", colourId: "c1", colourName: "White" };
  const base = { orderDate: "2026-08-17", dealerId: "d1", dealerName: "Functional Check Dealer", dealerCity: "Rajkot", dealerMobileNumber: "", dealerGstNumber: "", customerReference: "", expectedDispatchDate: "", remarks: "Phase 5 check", items: [
    { id: "n1", productId: "p1", productName: "MCB 16A", productCode: "MCB16", productType: "NORMAL", fanRodVariant: null, orderedQty: 5000, dispatchedQty: 0, cancelledQty: 0, remarks: "" },
    { id: "f1", productId: "fan", productName: "Fan Rod", productCode: "FR", productType: "FAN_ROD", fanRodVariant: variant, orderedQty: 1000, dispatchedQty: 0, cancelledQty: 0, remarks: "" },
  ] };
  let order = await orders.createDraft(base); order = await orders.confirm(order.id);
  const key = (item) => [item.productId, item.fanRodVariant?.gaugeId ?? "", item.fanRodVariant?.sizeId ?? "", item.fanRodVariant?.colourId ?? ""].join("::");
  await orders.createDispatch(order.id, { dispatchDate: "2026-08-17", remarks: "Partial normal", items: [{ lineKey: key(order.items[0]), quantity: 1000 }] });
  order = await orders.getById(order.id); assert.equal(order.items[0].dispatchedQty, 1000); assert.equal(order.items[0].orderedQty - order.items[0].dispatchedQty - order.items[0].cancelledQty, 4000);
  await orders.createDispatch(order.id, { dispatchDate: "2026-08-17", remarks: "Multiple with fan rod", items: [{ lineKey: key(order.items[0]), quantity: 500 }, { lineKey: key(order.items[1]), quantity: 400 }] });
  order = await orders.getById(order.id); assert.equal(order.items[1].dispatchedQty, 400); assert.equal(order.items[1].orderedQty - order.items[1].dispatchedQty, 600);
  await assert.rejects(() => orders.createDispatch(order.id, { dispatchDate: "2026-08-17", remarks: "Invalid", items: [{ lineKey: key(order.items[1]), quantity: 601 }] }), /cannot exceed/);
  await orders.createReduction(order.id, { reductionDate: "2026-08-17", reason: "Quantity reduced", remarks: "Customer requested less", items: [{ lineKey: key(order.items[0]), quantity: 1000 }] });
  order = await orders.getById(order.id); assert.equal(order.items[0].cancelledQty, 1000); assert.equal(order.items[0].orderedQty - order.items[0].dispatchedQty - order.items[0].cancelledQty, 2500);
  await assert.rejects(() => orders.createReduction(order.id, { reductionDate: "2026-08-17", reason: "Other", remarks: "Invalid", items: [{ lineKey: key(order.items[0]), quantity: 2501 }] }), /cannot exceed/);
  const remaining = order.items.map((item) => ({ lineKey: key(item), quantity: item.orderedQty - item.dispatchedQty - item.cancelledQty })).filter((item) => item.quantity > 0);
  await orders.createDispatch(order.id, { dispatchDate: "2026-08-18", remarks: "Complete all pending", items: remaining });
  order = await orders.getById(order.id); assert.equal(order.status, "COMPLETED"); assert.ok(order.items.every((item) => item.orderedQty - item.dispatchedQty - item.cancelledQty === 0));
  const historyBefore = await orders.listTransactions(order.id); assert.equal(historyBefore.filter((entry) => entry.type === "DISPATCH").length, 3); assert.equal(historyBefore.filter((entry) => entry.type === "CANCELLATION_REDUCTION").length, 1);
  const reopened = await orders.createDraft({ ...base, items: [{ ...base.items[0], orderedQty: 250 }] }); assert.equal(reopened.id, order.id); assert.equal(reopened.status, "PARTIALLY_DISPATCHED"); assert.equal(reopened.items[0].orderedQty, 5250); assert.equal(reopened.items[0].orderedQty - reopened.items[0].dispatchedQty - reopened.items[0].cancelledQty, 250);
  const historyAfter = await orders.listTransactions(order.id); assert.equal(historyAfter.length, historyBefore.length + 1); assert.equal(historyAfter.filter((entry) => entry.type === "ORDER_ADDITION").length, 2);
  const pendingOnlyEdit = { ...base, items: [{ ...reopened.items[0] }, { ...base.items[1], id: "new-fan", orderedQty: 100 }] };
  const afterPendingOnlyEdit = await orders.updateCurrent(order.id, pendingOnlyEdit); assert.equal(afterPendingOnlyEdit.items[1].orderedQty, 1100); assert.equal(afterPendingOnlyEdit.items[1].orderedQty - afterPendingOnlyEdit.items[1].dispatchedQty - afterPendingOnlyEdit.items[1].cancelledQty, 100);
  const remarkOnlySaved = await orders.updateCurrent(order.id, { ...base, items: afterPendingOnlyEdit.items.map((item, index) => ({ ...item, remarks: index === 0 ? "Urgent exception packing" : item.remarks })) }); assert.equal(remarkOnlySaved.items[0].remarks, "Urgent exception packing");
  console.log("Phase 5 functional checks passed: 13/13 scenarios covered.");

  const secondInput = { ...base, dealerId: "d2", dealerName: "Second Planning Dealer", dealerCity: "Ahmedabad", items: [{ ...base.items[0], id: "d2-normal", orderedQty: 300, remarks: "Pack 100 pcs per box" }, { ...base.items[1], id: "d2-fan", orderedQty: 500, remarks: "White boxes only" }] };
  let second = await orders.createDraft(secondInput); second = await orders.confirm(second.id);
  await orders.createDispatch(second.id, { dispatchDate: "2026-08-18", remarks: "Planning partial", items: [{ lineKey: key(second.items[0]), quantity: 100 }, { lineKey: key(second.items[1]), quantity: 200 }] });
  second = await orders.getById(second.id);
  const secondFirstDispatch = (await orders.listTransactions(second.id)).find((entry) => entry.type === "DISPATCH"); assert.equal(secondFirstDispatch.items.find((item) => item.productId === "p1").remarks, "Pack 100 pcs per box");
  await orders.createReduction(second.id, { reductionDate: "2026-08-18", reason: "Quantity reduced", remarks: "Planning reduction", items: [{ lineKey: key(second.items[0]), quantity: 50 }, { lineKey: key(second.items[1]), quantity: 100 }] });
  const { buildPlanningRows } = load(path.join(root, "src/features/planning/planning-calculations"));
  let planning = buildPlanningRows(await orders.list(), await orders.listAllTransactions(), new Map([["p1", "PCS"]]));
  let normalRows = planning.normal.filter((row) => row.productId === "p1"); assert.equal(normalRows.length, 2); assert.equal(normalRows.reduce((sum, row) => sum + row.pending, 0), 400); assert.equal(normalRows.find((row) => row.dealerId === "d2").pending, 150);
  let fanRows = planning.fanRod.filter((row) => row.gaugeId === "g1" && row.sizeId === "s1" && row.colourId === "c1"); assert.equal(fanRows.length, 2); assert.equal(fanRows.reduce((sum, row) => sum + row.pending, 0), 300); assert.equal(fanRows.find((row) => row.dealerId === "d2").pending, 200);
  second = await orders.getById(second.id); const secondNormal = second.items.find((item) => item.productId === "p1"); await orders.createDispatch(second.id, { dispatchDate: "2026-08-19", remarks: "Complete normal product", items: [{ lineKey: key(secondNormal), quantity: 150 }] });
  planning = buildPlanningRows(await orders.list(), await orders.listAllTransactions(), new Map([["p1", "PCS"]])); normalRows = planning.normal.filter((row) => row.productId === "p1"); assert.equal(normalRows.length, 1); assert.equal(normalRows[0].dealerId, "d1"); assert.equal(normalRows.reduce((sum, row) => sum + row.pending, 0), 250);
  fanRows = planning.fanRod.filter((row) => row.gaugeId === "g1"); const colourFiltered = fanRows.filter((row) => row.colourId === "c1"); assert.equal(colourFiltered.reduce((sum, row) => sum + row.pending, 0), fanRows.reduce((sum, row) => sum + row.pending, 0));
  const dealerMatrixTotal = fanRows.filter((row) => row.dealerId === "d2").reduce((sum, row) => sum + row.pending, 0); const dealerDetailTotal = planning.fanRod.filter((row) => row.dealerId === "d2").reduce((sum, row) => sum + row.pending, 0); assert.equal(dealerMatrixTotal, dealerDetailTotal);
  const { localFanRodOptionRepository } = load(path.join(root, "src/features/products/local-product-repository")); const activeSizes = (await localFanRodOptionRepository.list("SIZE")).filter((item) => item.status === "ACTIVE"); assert.equal(activeSizes.length, 10);
  console.log("Phase 6 planning checks passed: 16/16 scenarios covered.");

  const { dispatchCompletionType } = load(path.join(root, "src/types/order-transaction")); const d1History = await orders.listTransactions(order.id); const d1Dispatches = d1History.filter((entry) => entry.type === "DISPATCH").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  assert.equal(dispatchCompletionType(d1Dispatches[0].id, d1History), "PARTIAL"); assert.equal(dispatchCompletionType(d1Dispatches[2].id, d1History), "FINAL");
  assert.equal(d1Dispatches[0].items.length, 1); assert.equal(d1Dispatches[0].items[0].productName, "MCB 16A"); assert.equal(d1Dispatches[0].items[0].quantity, 1000);
  const mixedDispatch = d1Dispatches[1]; assert.ok(mixedDispatch.items.some((item) => item.productType === "NORMAL")); const printedFan = mixedDispatch.items.find((item) => item.productType === "FAN_ROD"); assert.equal(printedFan.fanRodVariant.gaugeName, "1.2mm"); assert.equal(printedFan.fanRodVariant.sizeName, "600mm"); assert.equal(printedFan.fanRodVariant.colourName, "White"); assert.equal(mixedDispatch.items.reduce((sum, item) => sum + item.quantity, 0), 900);
  const storageBeforePrintRead = JSON.stringify([...memory.entries()]); await orders.getTransaction(mixedDispatch.id); await orders.listTransactions(order.id); assert.equal(JSON.stringify([...memory.entries()]), storageBeforePrintRead);
  const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8"); const sheet = fs.readFileSync(path.join(root, "src/features/orders/a5-packing-sheet.tsx"), "utf8"); assert.match(css, /@page a5packing/); assert.match(css, /size:\s*A5 portrait/); assert.match(css, /table-header-group/); assert.match(css, /aside,\s*\n\s*button,\s*\n\s*nav/); assert.match(sheet, /Print A5 Packing Sheet/); assert.match(sheet, /No\. of Boxes/); assert.match(sheet, /LR \/ Transport Receipt No\./);
  console.log("Phase 7 A5 packing-sheet checks passed: 15/15 scenarios covered.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
