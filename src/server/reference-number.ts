import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export async function allocateReference(tx: Prisma.TransactionClient, prefix: "ORD" | "OA" | "DSP" | "CAN", date = new Date()) {
  const year = date.getFullYear();
  const counter = await tx.referenceCounter.upsert({
    where: { prefix_year: { prefix, year } },
    create: { prefix, year, nextValue: 2 },
    update: { nextValue: { increment: 1 } },
  });
  return `${prefix}-${year}-${String(counter.nextValue - 1).padStart(4, "0")}`;
}
