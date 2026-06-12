"use client";

import * as React from "react";
import { ProfileRenderer } from "@/components/templates/ProfileRenderer";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { cn } from "@/lib/utils";

const FRAME_W = 360;
const FRAME_H = 720;

export function ScaledPhonePreview({
  profile,
  links,
  scale = 0.36,
  className,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  scale?: number;
  className?: string;
}) {
  const w = Math.round(FRAME_W * scale);
  const h = Math.round(FRAME_H * scale);

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: w, height: h }}>
      <div
        className="origin-top-left"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
        }}
      >
        <div
          className="rounded-[48px] p-[14px] shadow-soft"
          style={{
            width: FRAME_W,
            height: FRAME_H,
            background: "linear-gradient(180deg, #0b0f1a 0%, #181a25 100%)",
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-white">
            <div
              className="absolute left-1/2 top-2 z-10 h-[26px] w-[110px] -translate-x-1/2 rounded-full"
              style={{ background: "#0b0f1a" }}
            />
            <div className="absolute inset-0 pt-0">
              <ProfileRenderer profile={profile} links={links} fluid />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
