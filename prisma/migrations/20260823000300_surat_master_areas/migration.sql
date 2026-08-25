CREATE TABLE "master_areas" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "master_areas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "master_areas_name_key" ON "master_areas"("name");
CREATE INDEX "master_areas_status_sort_order_idx" ON "master_areas"("status", "sort_order");
ALTER TABLE "dealers" ADD COLUMN "master_area_id" UUID NOT NULL;
ALTER TABLE "running_orders" ADD COLUMN "master_area_id" UUID, ADD COLUMN "master_area_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "order_additions" ADD COLUMN "master_area_id" UUID, ADD COLUMN "master_area_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "dispatches" ADD COLUMN "master_area_id" UUID, ADD COLUMN "master_area_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "cancellation_reductions" ADD COLUMN "master_area_id" UUID, ADD COLUMN "master_area_name" TEXT NOT NULL DEFAULT '';
CREATE INDEX "dealers_master_area_id_status_idx" ON "dealers"("master_area_id", "status");
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_master_area_id_fkey" FOREIGN KEY ("master_area_id") REFERENCES "master_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "running_orders" ADD CONSTRAINT "running_orders_master_area_id_fkey" FOREIGN KEY ("master_area_id") REFERENCES "master_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_additions" ADD CONSTRAINT "order_additions_master_area_id_fkey" FOREIGN KEY ("master_area_id") REFERENCES "master_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_master_area_id_fkey" FOREIGN KEY ("master_area_id") REFERENCES "master_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cancellation_reductions" ADD CONSTRAINT "cancellation_reductions_master_area_id_fkey" FOREIGN KEY ("master_area_id") REFERENCES "master_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Capture the dealer's current area on every new business header. These saved
-- values are never updated when a dealer is later moved to another area.
CREATE FUNCTION snapshot_dealer_master_area() RETURNS trigger AS $$
BEGIN
  SELECT d.master_area_id, a.name INTO NEW.master_area_id, NEW.master_area_name
  FROM dealers d JOIN master_areas a ON a.id = d.master_area_id
  WHERE d.id = NEW.dealer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER running_orders_area_snapshot BEFORE INSERT ON running_orders FOR EACH ROW EXECUTE FUNCTION snapshot_dealer_master_area();
CREATE TRIGGER order_additions_area_snapshot BEFORE INSERT ON order_additions FOR EACH ROW EXECUTE FUNCTION snapshot_dealer_master_area();
CREATE TRIGGER dispatches_area_snapshot BEFORE INSERT ON dispatches FOR EACH ROW EXECUTE FUNCTION snapshot_dealer_master_area();
CREATE TRIGGER cancellations_area_snapshot BEFORE INSERT ON cancellation_reductions FOR EACH ROW EXECUTE FUNCTION snapshot_dealer_master_area();
