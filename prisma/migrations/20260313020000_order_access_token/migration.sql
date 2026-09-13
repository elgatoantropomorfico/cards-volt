ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_accessToken_key" ON "orders"("accessToken");
