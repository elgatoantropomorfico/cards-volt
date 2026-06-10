"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Wraps public profile content. Preview (fluid) scrolls inside phone; public pages use body scroll only. */
export function TemplateRoot({
  fluid,
  className,
  children,
}: {
  fluid?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (fluid) {
    return (
      <div className={cn("h-full overflow-y-auto overscroll-contain", className)}>
        {children}
      </div>
    );
  }
  return <div className={cn("min-h-screen", className)}>{children}</div>;
}
