"use client";

import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { MinimalTemplate } from "./MinimalTemplate";
import { PremiumTemplate } from "./PremiumTemplate";
import { CorporateTemplate } from "./CorporateTemplate";
import { NoirTemplate } from "./NoirTemplate";
import { BloomTemplate } from "./BloomTemplate";
import { StudioTemplate } from "./StudioTemplate";
import { NovaTemplate } from "./NovaTemplate";
import { VividTemplate } from "./VividTemplate";

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
    case "NOIR":
      return <NoirTemplate profile={profile} links={links} fluid={fluid} />;
    case "BLOOM":
      return <BloomTemplate profile={profile} links={links} fluid={fluid} />;
    case "STUDIO":
      return <StudioTemplate profile={profile} links={links} fluid={fluid} />;
    case "NOVA":
      return <NovaTemplate profile={profile} links={links} fluid={fluid} />;
    case "VIVID":
      return <VividTemplate profile={profile} links={links} fluid={fluid} />;
    case "MINIMAL":
    default:
      return <MinimalTemplate profile={profile} links={links} fluid={fluid} />;
  }
}
