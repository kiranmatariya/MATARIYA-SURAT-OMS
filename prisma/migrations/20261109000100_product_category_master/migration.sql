CREATE TABLE "product_categories" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");
CREATE INDEX "product_categories_status_sort_order_idx" ON "product_categories"("status", "sort_order");

INSERT INTO "product_categories" ("id", "name", "sort_order", "status", "created_at", "updated_at")
SELECT md5('product-category:' || category_name)::uuid, category_name,
       ROW_NUMBER() OVER (ORDER BY category_name)::integer, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT BTRIM("category") AS category_name FROM "products" WHERE BTRIM("category") <> ''
  UNION SELECT 'MCB'
  UNION SELECT 'RCCB'
  UNION SELECT 'Isolator'
  UNION SELECT 'Fan Rod'
  UNION SELECT 'Switchgear'
  UNION SELECT 'Fan Accessories'
  UNION SELECT 'Earthing'
) categories
ON CONFLICT ("name") DO NOTHING;
