-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('NORMAL', 'FAN_ROD');

-- CreateEnum
CREATE TYPE "RunningOrderState" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OFFICE_STAFF');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OFFICE_STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL DEFAULT '',
    "mobile_number" TEXT NOT NULL DEFAULT '',
    "alternate_mobile_number" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "gst_number" TEXT NOT NULL DEFAULT '',
    "transport" TEXT NOT NULL DEFAULT '',
    "booking_center" TEXT NOT NULL DEFAULT '',
    "remarks" TEXT NOT NULL DEFAULT '',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "type" "ProductType" NOT NULL DEFAULT 'NORMAL',
    "remarks" TEXT NOT NULL DEFAULT '',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_rod_sizes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fan_rod_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_rod_colours" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fan_rod_colours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_rod_gauges" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fan_rod_gauges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "running_orders" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "dealer_id" UUID NOT NULL,
    "order_date" DATE NOT NULL,
    "customer_reference" TEXT NOT NULL DEFAULT '',
    "expected_dispatch_date" DATE,
    "remarks" TEXT NOT NULL DEFAULT '',
    "state" "RunningOrderState" NOT NULL DEFAULT 'DRAFT',
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "running_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "running_order_line_notes" (
    "id" UUID NOT NULL,
    "running_order_id" UUID NOT NULL,
    "line_key" TEXT NOT NULL,
    "product_id" UUID NOT NULL,
    "gauge_id" UUID,
    "size_id" UUID,
    "colour_id" UUID,
    "remarks" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "running_order_line_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_additions" (
    "id" UUID NOT NULL,
    "reference_number" TEXT NOT NULL,
    "running_order_id" UUID NOT NULL,
    "dealer_id" UUID NOT NULL,
    "addition_date" DATE NOT NULL,
    "customer_reference" TEXT NOT NULL DEFAULT '',
    "expected_dispatch_date" DATE,
    "remarks" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_additions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_addition_items" (
    "id" UUID NOT NULL,
    "addition_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "gauge_id" UUID,
    "size_id" UUID,
    "colour_id" UUID,
    "quantity" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "order_addition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatches" (
    "id" UUID NOT NULL,
    "reference_number" TEXT NOT NULL,
    "running_order_id" UUID NOT NULL,
    "dealer_id" UUID NOT NULL,
    "dispatch_date" DATE NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_items" (
    "id" UUID NOT NULL,
    "dispatch_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "gauge_id" UUID,
    "size_id" UUID,
    "colour_id" UUID,
    "quantity" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "dispatch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_reductions" (
    "id" UUID NOT NULL,
    "reference_number" TEXT NOT NULL,
    "running_order_id" UUID NOT NULL,
    "dealer_id" UUID NOT NULL,
    "reduction_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellation_reductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_reduction_items" (
    "id" UUID NOT NULL,
    "cancellation_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "gauge_id" UUID,
    "size_id" UUID,
    "colour_id" UUID,
    "quantity" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "cancellation_reduction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_counters" (
    "prefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "next_value" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_counters_pkey" PRIMARY KEY ("prefix","year")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "dealers_name_idx" ON "dealers"("name");

-- CreateIndex
CREATE INDEX "dealers_city_idx" ON "dealers"("city");

-- CreateIndex
CREATE INDEX "dealers_mobile_number_idx" ON "dealers"("mobile_number");

-- CreateIndex
CREATE INDEX "dealers_gst_number_idx" ON "dealers"("gst_number");

-- CreateIndex
CREATE INDEX "dealers_status_idx" ON "dealers"("status");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_status_type_idx" ON "products"("status", "type");

-- CreateIndex
CREATE INDEX "products_code_idx" ON "products"("code");

-- Blank product codes are allowed, but entered codes must remain unique.
CREATE UNIQUE INDEX "products_code_nonblank_key" ON "products"("code") WHERE "code" <> '';

-- CreateIndex
CREATE INDEX "fan_rod_sizes_status_sort_order_idx" ON "fan_rod_sizes"("status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "fan_rod_sizes_name_key" ON "fan_rod_sizes"("name");

-- CreateIndex
CREATE INDEX "fan_rod_colours_status_sort_order_idx" ON "fan_rod_colours"("status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "fan_rod_colours_name_key" ON "fan_rod_colours"("name");

-- CreateIndex
CREATE INDEX "fan_rod_gauges_status_sort_order_idx" ON "fan_rod_gauges"("status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "fan_rod_gauges_name_key" ON "fan_rod_gauges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "running_orders_order_number_key" ON "running_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "running_orders_dealer_id_key" ON "running_orders"("dealer_id");

-- CreateIndex
CREATE INDEX "running_orders_order_date_idx" ON "running_orders"("order_date");

-- CreateIndex
CREATE INDEX "running_orders_state_idx" ON "running_orders"("state");

-- CreateIndex
CREATE UNIQUE INDEX "running_order_line_notes_running_order_id_line_key_key" ON "running_order_line_notes"("running_order_id", "line_key");

-- CreateIndex
CREATE UNIQUE INDEX "order_additions_reference_number_key" ON "order_additions"("reference_number");

-- CreateIndex
CREATE INDEX "order_additions_dealer_id_addition_date_idx" ON "order_additions"("dealer_id", "addition_date");

-- CreateIndex
CREATE INDEX "order_additions_running_order_id_created_at_idx" ON "order_additions"("running_order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_addition_items_product_id_idx" ON "order_addition_items"("product_id");

-- CreateIndex
CREATE INDEX "order_addition_items_product_id_gauge_id_size_id_colour_id_idx" ON "order_addition_items"("product_id", "gauge_id", "size_id", "colour_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispatches_reference_number_key" ON "dispatches"("reference_number");

-- CreateIndex
CREATE INDEX "dispatches_dealer_id_dispatch_date_idx" ON "dispatches"("dealer_id", "dispatch_date");

-- CreateIndex
CREATE INDEX "dispatches_running_order_id_created_at_idx" ON "dispatches"("running_order_id", "created_at");

-- CreateIndex
CREATE INDEX "dispatch_items_product_id_gauge_id_size_id_colour_id_idx" ON "dispatch_items"("product_id", "gauge_id", "size_id", "colour_id");

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_reductions_reference_number_key" ON "cancellation_reductions"("reference_number");

-- CreateIndex
CREATE INDEX "cancellation_reductions_dealer_id_reduction_date_idx" ON "cancellation_reductions"("dealer_id", "reduction_date");

-- CreateIndex
CREATE INDEX "cancellation_reductions_running_order_id_created_at_idx" ON "cancellation_reductions"("running_order_id", "created_at");

-- CreateIndex
CREATE INDEX "cancellation_reduction_items_product_id_gauge_id_size_id_co_idx" ON "cancellation_reduction_items"("product_id", "gauge_id", "size_id", "colour_id");

-- AddForeignKey
ALTER TABLE "running_orders" ADD CONSTRAINT "running_orders_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_order_line_notes" ADD CONSTRAINT "running_order_line_notes_running_order_id_fkey" FOREIGN KEY ("running_order_id") REFERENCES "running_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_order_line_notes" ADD CONSTRAINT "running_order_line_notes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_order_line_notes" ADD CONSTRAINT "running_order_line_notes_gauge_id_fkey" FOREIGN KEY ("gauge_id") REFERENCES "fan_rod_gauges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_order_line_notes" ADD CONSTRAINT "running_order_line_notes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "fan_rod_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "running_order_line_notes" ADD CONSTRAINT "running_order_line_notes_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "fan_rod_colours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_additions" ADD CONSTRAINT "order_additions_running_order_id_fkey" FOREIGN KEY ("running_order_id") REFERENCES "running_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_additions" ADD CONSTRAINT "order_additions_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addition_items" ADD CONSTRAINT "order_addition_items_addition_id_fkey" FOREIGN KEY ("addition_id") REFERENCES "order_additions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addition_items" ADD CONSTRAINT "order_addition_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addition_items" ADD CONSTRAINT "order_addition_items_gauge_id_fkey" FOREIGN KEY ("gauge_id") REFERENCES "fan_rod_gauges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addition_items" ADD CONSTRAINT "order_addition_items_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "fan_rod_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addition_items" ADD CONSTRAINT "order_addition_items_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "fan_rod_colours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_running_order_id_fkey" FOREIGN KEY ("running_order_id") REFERENCES "running_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "dispatches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_gauge_id_fkey" FOREIGN KEY ("gauge_id") REFERENCES "fan_rod_gauges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "fan_rod_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "fan_rod_colours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_reductions" ADD CONSTRAINT "cancellation_reductions_running_order_id_fkey" FOREIGN KEY ("running_order_id") REFERENCES "running_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_reductions" ADD CONSTRAINT "cancellation_reductions_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_reduction_items" ADD CONSTRAINT "cancellation_reduction_items_cancellation_id_fkey" FOREIGN KEY ("cancellation_id") REFERENCES "cancellation_reductions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_reduction_items" ADD CONSTRAINT "cancellation_reduction_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_reduction_items" ADD CONSTRAINT "cancellation_reduction_items_gauge_id_fkey" FOREIGN KEY ("gauge_id") REFERENCES "fan_rod_gauges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_reduction_items" ADD CONSTRAINT "cancellation_reduction_items_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "fan_rod_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_reduction_items" ADD CONSTRAINT "cancellation_reduction_items_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "fan_rod_colours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Quantities are append-only positive integers. Pending is derived from these histories.
ALTER TABLE "order_addition_items" ADD CONSTRAINT "order_addition_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "cancellation_reduction_items" ADD CONSTRAINT "cancellation_reduction_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "reference_counters" ADD CONSTRAINT "reference_counters_next_value_positive" CHECK ("next_value" > 0);
