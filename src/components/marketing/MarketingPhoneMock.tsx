"use client";

import * as React from "react";
import { PhonePreview } from "@/components/dashboard/PhonePreview";
import { DEMO_LINKS, demoProfileFor } from "@/lib/demo-profile";
import type { ProfileView } from "@/lib/profile-types";
import { cn } from "@/lib/utils";

export function MarketingPhoneMock({
  template = "PREMIUM",
  className,
}: {
  template?: ProfileView["template"];
  className?: string;
}) {
  const profile = React.useMemo(() => demoProfileFor(template), [template]);
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-br from-violet-500/25 via-fuchsia-500/15 to-transparent blur-3xl" />
      <PhonePreview profile={profile} links={DEMO_LINKS} />
    </div>
  );
}
