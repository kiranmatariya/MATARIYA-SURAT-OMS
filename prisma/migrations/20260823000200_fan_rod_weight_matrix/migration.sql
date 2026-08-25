CREATE TABLE "fan_rod_variant_weights" (
    "id" UUID NOT NULL,
    "gauge_id" UUID NOT NULL,
    "size_id" UUID NOT NULL,
    "weight_per_piece_kg" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fan_rod_variant_weights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fan_rod_variant_weights_gauge_id_size_id_key"
ON "fan_rod_variant_weights"("gauge_id", "size_id");

CREATE INDEX "fan_rod_variant_weights_size_id_idx"
ON "fan_rod_variant_weights"("size_id");

ALTER TABLE "fan_rod_variant_weights"
ADD CONSTRAINT "fan_rod_variant_weights_gauge_id_fkey"
FOREIGN KEY ("gauge_id") REFERENCES "fan_rod_gauges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fan_rod_variant_weights"
ADD CONSTRAINT "fan_rod_variant_weights_size_id_fkey"
FOREIGN KEY ("size_id") REFERENCES "fan_rod_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
