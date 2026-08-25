import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { postgresAdapter } from "../src/server/postgres-adapter";

config({ path: [".env.local", ".env"] });

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SEED !== "true") {
  throw new Error("Development seed is disabled in production. Set ALLOW_DEV_SEED=true only if intentional.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed the database.");
const db = new PrismaClient({ adapter: postgresAdapter(process.env.DATABASE_URL) });

async function main() {
  const area = await db.masterArea.upsert({ where: { name: "Surat Central" }, update: {}, create: { name: "Surat Central", sortOrder: 1 } });
  for (const name of ["ABC Electricals", "Surat Electricals", "Raj Distributors"]) {
    const existing = await db.dealer.findFirst({ where: { name } });
    if (!existing) await db.dealer.create({ data: { name, city: "Surat", state: "Gujarat", masterAreaId: area.id } });
  }
  const products = [
    ["SP MCB 16A", "MCB-16A", "MCB", "NORMAL"], ["SP MCB 32A", "MCB-32A", "MCB", "NORMAL"],
    ["RCCB 40A 30mA", "RCCB-40A", "RCCB", "NORMAL"], ["Isolator 63A", "ISO-63A", "Isolator", "NORMAL"],
    ["Fan Rod", "FAN-ROD", "Fan Rod", "FAN_ROD"],
  ] as const;
  for (const [name, code, category, type] of products) {
    const existing = await db.product.findFirst({ where: { code } });
    if (!existing) await db.product.create({ data: { name, code, category, unit: "PCS", type } });
  }
  for (const [index, name] of ["300mm", "450mm", "600mm", "750mm", "900mm", "1050mm", "1200mm"].entries()) await db.fanRodSize.upsert({ where: { name }, update: {}, create: { name, sortOrder: index + 1 } });
  for (const [index, name] of ["White", "Black", "Brown", "Ivory", "Gold", "Silver"].entries()) await db.fanRodColour.upsert({ where: { name }, update: {}, create: { name, sortOrder: index + 1 } });
  for (const [index, name] of ["Light", "Medium", "Heavy"].entries()) await db.fanRodGauge.upsert({ where: { name }, update: {}, create: { name, sortOrder: index + 1 } });
}

main().finally(() => db.$disconnect());
