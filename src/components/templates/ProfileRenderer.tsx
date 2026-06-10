"use client";

import * as React from "react";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { MinimalTemplate } from "./MinimalTemplate";
import { PremiumTemplate } from "./PremiumTemplate";
import { CorporateTemplate } from "./CorporateTemplate";

export type ProfileRendererProps = {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
};

export function ProfileRenderer({ profile, links, fluid }: ProfileRendererProps) {
  switch (profile.template) {
    case "PREMIUM":
      return <PremiumTemplate profile={profile} links={links} fluid={fluid} />;
    case "CORPORATE":
      return <CorporateTemplate profile={profile} links={links} fluid={fluid} />;
    case "MINIMAL":
    default:
      return <MinimalTemplate profile={profile} links={links} fluid={fluid} />;
  }
}
