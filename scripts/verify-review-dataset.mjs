import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const marker = "SURAT OMS REVIEW DATASET 2026-08-25";

try {
  const [areaCounts, totals, reviewTransactions, invalidPending] = await Promise.all([
    pool.query(
      `SELECT a.name AS master_area, COUNT(d.id)::int AS dealers, COUNT(o.id)::int AS orders
       FROM master_areas a
       LEFT JOIN dealers d ON d.master_area_id = a.id AND d.remarks = $1
       LEFT JOIN running_orders o ON o.dealer_id = d.id
       WHERE a.status = 'ACTIVE'
       GROUP BY a.id, a.name, a.sort_order ORDER BY a.sort_order, a.name`,
      [marker],
    ),
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM dealers WHERE remarks = $1) AS review_dealers,
         (SELECT COUNT(*)::int FROM running_orders o JOIN dealers d ON d.id = o.dealer_id WHERE d.remarks = $1) AS review_orders,
         (SELECT COUNT(*)::int FROM order_additions a JOIN dealers d ON d.id = a.dealer_id WHERE d.remarks = $1) AS review_additions`,
      [marker],
    ),
    pool.query(
      `SELECT o.order_number, d.name AS dealer, o.state,
              (SELECT MIN(a.created_at) FROM order_additions a WHERE a.running_order_id = o.id) AS first_addition_at,
              (SELECT MIN(x.created_at) FROM dispatches x WHERE x.running_order_id = o.id) AS first_dispatch_at,
              (SELECT COALESCE(SUM(ai.quantity), 0)::int FROM order_additions a JOIN order_addition_items ai ON ai.addition_id = a.id WHERE a.running_order_id = o.id) AS ordered_quantity,
              COUNT(DISTINCT ds.id)::int AS dispatches,
              COALESCE(SUM(di.quantity), 0)::int AS dispatched_quantity,
              COUNT(DISTINCT cr.id)::int AS reductions,
              COALESCE(SUM(ci.quantity), 0)::int AS reduced_quantity
       FROM running_orders o
       JOIN dealers d ON d.id = o.dealer_id
       LEFT JOIN dispatches ds ON ds.running_order_id = o.id
       LEFT JOIN dispatch_items di ON di.dispatch_id = ds.id
       LEFT JOIN cancellation_reductions cr ON cr.running_order_id = o.id
       LEFT JOIN cancellation_reduction_items ci ON ci.cancellation_id = cr.id
       WHERE d.remarks = $1 AND (ds.id IS NOT NULL OR cr.id IS NOT NULL)
       GROUP BY o.id, o.order_number, d.name, o.state
       ORDER BY o.order_number`,
      [marker],
    ),
    pool.query(
      `WITH ordered AS (
         SELECT a.running_order_id, i.product_id, i.gauge_id, i.size_id, i.colour_id, SUM(i.quantity)::int AS qty
         FROM order_additions a JOIN order_addition_items i ON i.addition_id = a.id
         GROUP BY a.running_order_id, i.product_id, i.gauge_id, i.size_id, i.colour_id
       ), dispatched AS (
         SELECT d.running_order_id, i.product_id, i.gauge_id, i.size_id, i.colour_id, SUM(i.quantity)::int AS qty
         FROM dispatches d JOIN dispatch_items i ON i.dispatch_id = d.id
         GROUP BY d.running_order_id, i.product_id, i.gauge_id, i.size_id, i.colour_id
       ), reduced AS (
         SELECT c.running_order_id, i.product_id, i.gauge_id, i.size_id, i.colour_id, SUM(i.quantity)::int AS qty
         FROM cancellation_reductions c JOIN cancellation_reduction_items i ON i.cancellation_id = c.id
         GROUP BY c.running_order_id, i.product_id, i.gauge_id, i.size_id, i.colour_id
       )
       SELECT COUNT(*)::int AS invalid_lines
       FROM ordered o
       LEFT JOIN dispatched d ON d.running_order_id = o.running_order_id AND d.product_id = o.product_id
         AND d.gauge_id IS NOT DISTINCT FROM o.gauge_id AND d.size_id IS NOT DISTINCT FROM o.size_id AND d.colour_id IS NOT DISTINCT FROM o.colour_id
       LEFT JOIN reduced r ON r.running_order_id = o.running_order_id AND r.product_id = o.product_id
         AND r.gauge_id IS NOT DISTINCT FROM o.gauge_id AND r.size_id IS NOT DISTINCT FROM o.size_id AND r.colour_id IS NOT DISTINCT FROM o.colour_id
       WHERE o.qty - COALESCE(d.qty, 0) - COALESCE(r.qty, 0) < 0`,
    ),
  ]);

  console.log("Review dataset totals:", totals.rows[0]);
  console.table(areaCounts.rows);
  console.log("Review orders with processing history:");
  console.table(reviewTransactions.rows);
  console.log("Invalid negative-pending lines:", invalidPending.rows[0].invalid_lines);

  const totalsRow = totals.rows[0];
  if (totalsRow.review_dealers !== 50 || totalsRow.review_orders !== 50 || totalsRow.review_additions < 50) throw new Error("Review dataset totals are incomplete.");
  if (areaCounts.rows.some((row) => row.dealers < 5)) throw new Error("A Master Area has fewer than five review dealers.");
  if (invalidPending.rows[0].invalid_lines !== 0) throw new Error("A processed quantity exceeds its ordered quantity.");
} finally {
  await pool.end();
}
