# Matariya OMS contributor guidance

These instructions apply to all work in this repository.

## Product scope

Matariya OMS is a web-based order management system for a manufacturing company. Explain important technical and architectural decisions in simple language because the product owner is not a programmer.

Planned modules are:

1. Dealer Master
2. Product Master
3. Order Entry
4. Order Management
5. Partial Dispatch
6. Pending Order Production Planning
7. Special Fan Rod Production Planning Matrix
8. A5 Packing / Dispatch Sheet
9. Dashboard

Do not implement a future module unless the current task explicitly requests it.

## Business rules

- Only office staff create orders.
- Customers are dealers and distributors.
- Prices are not required anywhere in the order workflow.
- Inventory management is outside the scope of the system.
- Products are manufactured against pending orders.
- An order can contain multiple products.
- A dealer may have only one current order at a time. Draft, Confirmed, and Partially Dispatched count as current; Completed and Cancelled orders remain history and do not block a future order.
- Current orders, including Confirmed orders, may be edited to add later customer requirements. Never allow an edit to remove a line with processed quantities or reduce ordered quantity below dispatched plus cancelled quantity.
- Partial dispatch must be supported.
- Pending quantity is always calculated as: `ordered quantity - dispatched quantity - cancelled quantity`.
- Completed and partially dispatched orders must retain their history.
- Draft or erroneous orders may be permanently deleted.
- Confirmed orders should normally be cancelled, not permanently deleted, so their history remains available.
- Fan Rod products have Size, Colour, and Gauge/Quality variants.
- Fan Rod production planning must eventually show pending quantities party-wise, size-wise, and colour-wise, with gauge-based filtering and grouping.
- The system will eventually provide an A5 printable packing/dispatch sheet for dispatch staff.

## Architecture guardrails

- Use Next.js, TypeScript, and Tailwind CSS.
- Keep the data layer compatible with PostgreSQL.
- Keep database access and secrets in server-only code; never expose credentials to the browser.
- Record future database schema changes through migrations.
- Preserve order and dispatch history when designing future data models.
- Do not add pricing or inventory features unless the product owner explicitly changes the scope.
- Before making a major unexpected architectural change, explain the reason and impact in simple language.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
