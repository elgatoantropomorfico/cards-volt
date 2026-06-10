"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Normalized cover: 2:1 landscape (width × height). */
export function CoverImage({
  src,
  alt = "",
  className,
  overlay,
}: {
  src: string;
  alt?: string;
  className?: string;
  overlay?: React.ReactNode;
}) {
  return (
    <div className={cn("relative aspect-[2/1] w-full overflow-hidden bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-center" />
      {overlay}
    </div>
  );
}
