import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Link as LinkRow } from "@prisma/client";

export function LinkList({ links, variant = "minimal" }: { links: LinkRow[]; variant?: "minimal" | "premium" | "corporate" }) {
  if (!links.length) return null;
  return (
    <div className="flex w-full flex-col gap-2">
      {links.map((l) => (
        <Link
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noopener"
          className={
            variant === "premium"
              ? "group flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white shadow-sm backdrop-blur transition hover:bg-white/20"
              : variant === "corporate"
                ? "group flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-400"
                : "group flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:shadow"
          }
        >
          <span className="truncate">{l.label}</span>
          <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  );
}
