import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("COMPANY_ADMIN", "SUPERADMIN");
  if (!user.companyId) {
    if (user.role === "SUPERADMIN") redirect("/admin");
    redirect("/dashboard");
  }
  return children;
}
