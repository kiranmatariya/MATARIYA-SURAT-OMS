-- Better Auth user/session/account tables and OMS transaction attribution.
ALTER TABLE "users" DROP COLUMN "password_hash";
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "image" TEXT;
ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD COLUMN "display_username" TEXT;
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
DROP TYPE "UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OFFICE_STAFF';
ALTER TABLE "users" ADD COLUMN "banned" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "ban_reason" TEXT;
ALTER TABLE "users" ADD COLUMN "ban_expires" TIMESTAMP(3);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TABLE "sessions" (
  "id" UUID NOT NULL, "expires_at" TIMESTAMP(3) NOT NULL, "token" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  "ip_address" TEXT, "user_agent" TEXT, "user_id" UUID NOT NULL, "impersonated_by" TEXT,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

CREATE TABLE "accounts" (
  "id" UUID NOT NULL, "account_id" TEXT NOT NULL, "provider_id" TEXT NOT NULL, "user_id" UUID NOT NULL,
  "access_token" TEXT, "refresh_token" TEXT, "id_token" TEXT, "access_token_expires_at" TIMESTAMP(3),
  "refresh_token_expires_at" TIMESTAMP(3), "scope" TEXT, "password" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

CREATE TABLE "verifications" (
  "id" UUID NOT NULL, "identifier" TEXT NOT NULL, "value" TEXT NOT NULL, "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

ALTER TABLE "order_additions" ADD COLUMN "created_by_id" UUID;
ALTER TABLE "dispatches" ADD COLUMN "created_by_id" UUID;
ALTER TABLE "cancellation_reductions" ADD COLUMN "created_by_id" UUID;
CREATE INDEX "order_additions_created_by_id_idx" ON "order_additions"("created_by_id");
CREATE INDEX "dispatches_created_by_id_idx" ON "dispatches"("created_by_id");
CREATE INDEX "cancellation_reductions_created_by_id_idx" ON "cancellation_reductions"("created_by_id");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_additions" ADD CONSTRAINT "order_additions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cancellation_reductions" ADD CONSTRAINT "cancellation_reductions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
