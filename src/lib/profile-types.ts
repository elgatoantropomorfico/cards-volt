export type Template = "MINIMAL" | "PREMIUM" | "CORPORATE";
export type ThemeMode = "LIGHT" | "DARK";
export type LinkKind =
  | "WEBSITE"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "TWITTER"
  | "FACEBOOK"
  | "YOUTUBE"
  | "TIKTOK"
  | "GITHUB"
  | "SPOTIFY"
  | "CALENDAR"
  | "EMAIL"
  | "PHONE"
  | "WHATSAPP"
  | "MAP"
  | "PDF"
  | "OTHER";

export type ProfileLink = {
  id: string;
  kind: LinkKind;
  label: string;
  url: string;
  icon?: string | null;
  order: number;
};

export type NfcCardStatus = "UNASSIGNED" | "ACTIVE" | "INACTIVE" | "LOST";

export type NfcCardView = {
  id: string;
  code: string;
  status: NfcCardStatus;
  assignedAt: string | null;
};

export type ProfileView = {
  id: string;
  slug: string;
  active: boolean;
  fullName: string;
  jobTitle?: string | null;
  companyName?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  github?: string | null;
  template: Template;
  primaryColor: string;
  themeMode: ThemeMode;
};
