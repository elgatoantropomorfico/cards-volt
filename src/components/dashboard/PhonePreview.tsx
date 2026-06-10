"use client";

import * as React from "react";
import { ProfileRenderer } from "@/components/templates/ProfileRenderer";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { motion, AnimatePresence } from "framer-motion";

export function PhonePreview({
  profile,
  links,
  className,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  className?: string;
}) {
  const key = `${profile.template}-${profile.themeMode}-${profile.primaryColor}`;
  return (
    <div className={className}>
      <div className="phone-frame mx-auto">
        <div className="phone-screen relative">
          <div className="phone-notch" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <div className="h-full w-full overflow-hidden">
                <ProfileRenderer profile={profile} links={links} fluid />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
