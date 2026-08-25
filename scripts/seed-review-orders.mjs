import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required in .env.local.");

const pool = new Pool({ connectionString: databaseUrl });
const REVIEW_MARKER = "SURAT OMS REVIEW DATASET 2026-08-25";
const TOTAL_REVIEW_DEALERS = 50;
const ORDER_DATE = "2026-08-25";
const EXPECTED_DATE = "2026-08-30";

async function allocateReference(client, prefix) {
  const year = 2026;
  const result = await client.query(
    `INSERT INTO reference_counters (prefix, year, next_value, updated_at)
     VALUES ($1, $2, 2, NOW())
     ON CONFLICT (prefix, year) DO UPDATE
     SET next_value = reference_counters.next_value + 1, updated_at = NOW()
     RETURNING next_value - 1 AS allocated`,
    [prefix, year],
  );
  return `${prefix}-${year}-${String(result.rows[0].allocated).padStart(4, "0")}`;
}

async function loadReviewInputs() {
  const [areas, normalProducts, fanRodProducts, sizes, colours, gauges, users] = await Promise.all([
    pool.query(`SELECT id, name FROM master_areas WHERE status = 'ACTIVE' ORDER BY sort_order, name`),
    pool.query(`SELECT id, name FROM products WHERE status = 'ACTIVE' AND type = 'NORMAL' ORDER BY name`),
    pool.query(`SELECT id, name FROM products WHERE status = 'ACTIVE' AND type = 'FAN_ROD' ORDER BY name LIMIT 1`),
    pool.query(`SELECT id, name FROM fan_rod_sizes WHERE status = 'ACTIVE' ORDER BY sort_order, name`),
    pool.query(`SELECT id, name FROM fan_rod_colours WHERE status = 'ACTIVE' ORDER BY sort_order, name`),
    pool.query(`SELECT id, name FROM fan_rod_gauges WHERE status = 'ACTIVE' ORDER BY sort_order, name`),
    pool.query(`SELECT id FROM users WHERE active = TRUE ORDER BY created_at LIMIT 1`),
  ]);
  return {
    areas: areas.rows,
    normalProducts: normalProducts.rows,
    fanRodProduct: fanRodProducts.rows[0] ?? null,
    sizes: sizes.rows,
    colours: colours.rows,
    gauges: gauges.rows,
    creator: users.rows[0] ?? null,
  };
}

async function createPartyAndOrder(input) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existingDealer = await client.query(
      `SELECT id FROM dealers WHERE name = $1 AND remarks = $2 LIMIT 1`,
      [input.dealerName, REVIEW_MARKER],
    );
    let dealerId = existingDealer.rows[0]?.id;
    let dealerCreated = false;
    if (!dealerId) {
      dealerId = randomUUID();
      await client.query(
        `INSERT INTO dealers
          (id, name, contact_person, mobile_number, alternate_mobile_number, address, city, state,
           gst_number, transport, booking_center, remarks, status, created_at, updated_at, master_area_id)
         VALUES ($1, $2, $3, $4, '', $5, 'Surat', 'Gujarat', '', '', '', $6, 'ACTIVE', NOW(), NOW(), $7)`,
        [dealerId, input.dealerName, input.contactPerson, input.mobileNumber, input.address, REVIEW_MARKER, input.area.id],
      );
      dealerCreated = true;
    }

    const existingOrder = await client.query(`SELECT id FROM running_orders WHERE dealer_id = $1`, [dealerId]);
    if (existingOrder.rowCount) {
      await client.query("COMMIT");
      return { dealerCreated, orderCreated: false };
    }

    const orderId = randomUUID();
    const orderNumber = await allocateReference(client, "ORD");
    await client.query(
      `INSERT INTO running_orders
        (id, order_number, dealer_id, master_area_id, master_area_name, order_date, customer_reference,
         expected_dispatch_date, remarks, state, confirmed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'CONFIRMED', NOW(), NOW(), NOW())`,
      [orderId, orderNumber, dealerId, input.area.id, input.area.name, ORDER_DATE, input.customerReference, EXPECTED_DATE, REVIEW_MARKER],
    );

    const additionId = randomUUID();
    const additionNumber = await allocateReference(client, "OA");
    await client.query(
      `INSERT INTO order_additions
        (id, reference_number, running_order_id, dealer_id, master_area_id, master_area_name, addition_date,
         customer_reference, expected_dispatch_date, remarks, created_at, created_by_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $7::date::timestamp, $11)`,
      [additionId, additionNumber, orderId, dealerId, input.area.id, input.area.name, ORDER_DATE, input.customerReference, EXPECTED_DATE, REVIEW_MARKER, input.creator.id],
    );

    if (input.normalProduct) {
      await client.query(
        `INSERT INTO order_addition_items
          (id, addition_id, product_id, gauge_id, size_id, colour_id, quantity, remarks)
         VALUES ($1, $2, $3, NULL, NULL, NULL, $4, $5)`,
        [randomUUID(), additionId, input.normalProduct.id, 25 + input.sequence * 5, input.sequence % 3 === 0 ? "Priority review item" : ""],
      );
    }
    if (input.fanRodProduct) {
      await client.query(
        `INSERT INTO order_addition_items
          (id, addition_id, product_id, gauge_id, size_id, colour_id, quantity, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [randomUUID(), additionId, input.fanRodProduct.id, input.gauge.id, input.size.id, input.colour.id,
          100 + input.sequence * 10, input.sequence % 4 === 0 ? "Pack separately" : ""],
      );
    }

    await client.query("COMMIT");
    return { dealerCreated, orderCreated: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const inputs = await loadReviewInputs();
  if (!inputs.areas.length) throw new Error("Create at least one active Master Area first.");
  if (inputs.areas.length > TOTAL_REVIEW_DEALERS / 5) throw new Error("Fifty dealers cannot provide five dealers to every active Master Area.");
  if (!inputs.normalProducts.length && !inputs.fanRodProduct) throw new Error("Create at least one active product first.");
  if (inputs.fanRodProduct && (!inputs.sizes.length || !inputs.colours.length || !inputs.gauges.length)) throw new Error("Active Fan Rod Size, Colour and Gauge records are required.");
  if (!inputs.creator) throw new Error("Create an active OMS user first.");

  const minimumPerArea = 5;
  const remaining = TOTAL_REVIEW_DEALERS - inputs.areas.length * minimumPerArea;
  const extraPerArea = Math.floor(remaining / inputs.areas.length);
  const extraRemainder = remaining % inputs.areas.length;
  const plannedCounts = inputs.areas.map((_, index) => minimumPerArea + extraPerArea + (index < extraRemainder ? 1 : 0));
  const totals = { createdDealers: 0, reusedDealers: 0, createdOrders: 0, skippedExistingOrders: 0 };
  let sequence = 0;

  for (let areaIndex = 0; areaIndex < inputs.areas.length; areaIndex += 1) {
    const area = inputs.areas[areaIndex];
    for (let partyIndex = 0; partyIndex < plannedCounts[areaIndex]; partyIndex += 1) {
      sequence += 1;
      const partyNumber = String(partyIndex + 1).padStart(2, "0");
      const result = await createPartyAndOrder({
        area,
        creator: inputs.creator,
        sequence,
        dealerName: `REVIEW - ${area.name} Party ${partyNumber}`,
        contactPerson: `Review Contact ${String(sequence).padStart(2, "0")}`,
        mobileNumber: String(9100000000 + sequence),
        address: `Dummy review address ${sequence}, ${area.name}, Surat`,
        customerReference: `DUMMY-${String(sequence).padStart(3, "0")}`,
        normalProduct: inputs.normalProducts.length ? inputs.normalProducts[(sequence - 1) % inputs.normalProducts.length] : null,
        fanRodProduct: inputs.fanRodProduct,
        size: inputs.sizes.length ? inputs.sizes[(sequence - 1) % inputs.sizes.length] : null,
        colour: inputs.colours.length ? inputs.colours[(sequence - 1) % inputs.colours.length] : null,
        gauge: inputs.gauges.length ? inputs.gauges[(sequence - 1) % inputs.gauges.length] : null,
      });
      totals[result.dealerCreated ? "createdDealers" : "reusedDealers"] += 1;
      totals[result.orderCreated ? "createdOrders" : "skippedExistingOrders"] += 1;
    }
  }

  // Keep imported additions chronologically before transactions entered through the OMS.
  await pool.query(
    `UPDATE order_additions SET created_at = addition_date::timestamp WHERE remarks = $1`,
    [REVIEW_MARKER],
  );

  const verification = await pool.query(
    `SELECT a.name AS master_area,
            COUNT(d.id)::int AS review_dealers,
            COUNT(o.id)::int AS review_orders
     FROM master_areas a
     LEFT JOIN dealers d ON d.master_area_id = a.id AND d.remarks = $1
     LEFT JOIN running_orders o ON o.dealer_id = d.id
     WHERE a.status = 'ACTIVE'
     GROUP BY a.id, a.name, a.sort_order
     ORDER BY a.sort_order, a.name`,
    [REVIEW_MARKER],
  );
  const dealerCount = verification.rows.reduce((sum, row) => sum + row.review_dealers, 0);
  const orderCount = verification.rows.reduce((sum, row) => sum + row.review_orders, 0);
  if (dealerCount !== 50 || orderCount !== 50 || verification.rows.some((row) => row.review_dealers < 5)) {
    throw new Error(`Verification failed: found ${dealerCount} review dealers and ${orderCount} review orders.`);
  }
  console.log(`Review data ready: ${dealerCount} dealers and ${orderCount} confirmed orders.`);
  console.table(verification.rows);
  console.log(totals);
}

try {
  await main();
} finally {
  await pool.end();
}
