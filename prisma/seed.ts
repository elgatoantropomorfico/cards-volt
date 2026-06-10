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

  // Delete any existing user with this email so the password hash is
  // regenerated against the current Better Auth config (avoids stale-hash
  // incompatibilities when the auth config changes).
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log(`✔ Removed stale user ${email} (will recreate)`);
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
