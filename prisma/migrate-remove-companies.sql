-- Run once before `prisma db push` when removing the company module.
-- Converts legacy company admins to regular users and drops tenant tables/columns.

UPDATE users SET role = 'USER' WHERE role::text = 'COMPANY_ADMIN';

ALTER TABLE users DROP COLUMN IF EXISTS "companyId";
ALTER TABLE profiles DROP COLUMN IF EXISTS "companyId";
ALTER TABLE nfc_cards DROP COLUMN IF EXISTS "companyId";

DROP TABLE IF EXISTS companies;

-- PostgreSQL cannot drop enum values directly; Prisma db push recreates Role enum.
