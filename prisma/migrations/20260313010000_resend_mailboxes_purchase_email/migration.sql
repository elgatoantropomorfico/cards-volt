-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "resendApiKey" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "purchaseEmailSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "store_mailboxes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GENERAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_mailboxes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "store_mailboxes_email_key" ON "store_mailboxes"("email");
CREATE INDEX IF NOT EXISTS "store_mailboxes_role_active_idx" ON "store_mailboxes"("role", "active");
