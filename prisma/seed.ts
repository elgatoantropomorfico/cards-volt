/**
 * Volt Cards initial seed.
 * - Creates the superadmin if it doesn't exist (idempotent).
 * - Uses Better Auth's signup so the password hash is compatible.
 */
import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || "admin@voltaiagents.com";
  const password = process.env.SEED_SUPERADMIN_PASSWORD || "ChangeMe!2026";
  const name = process.env.SEED_SUPERADMIN_NAME || "Super Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "SUPERADMIN") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "SUPERADMIN", emailVerified: true } });
      console.log(`✔ Promoted existing user to SUPERADMIN: ${email}`);
    } else {
      console.log(`✔ Superadmin already exists: ${email}`);
    }
    return;
  }

  try {
    const signup = await auth.api.signUpEmail({
      body: { name, email, password },
    });
    const userId = signup?.user?.id;
    if (!userId) throw new Error("Better Auth signup returned no user id");
    await prisma.user.update({
      where: { id: userId },
      data: { role: "SUPERADMIN", emailVerified: true },
    });
    console.log(`✅ Created SUPERADMIN: ${email} / ${password}`);
    console.log("⚠  Change this password after first login.");
  } catch (err) {
    console.error("Seed error:", err);
    throw err;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
