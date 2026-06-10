import type { Link as LinkRow, Profile } from "@prisma/client";
import { ContactActions } from "./actions";
import { LinkList } from "./LinkList";

export function CorporateTemplate({ profile, links }: { profile: Profile; links: LinkRow[] }) {
  const accent = profile.primaryColor || "#1E3A8A";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="border-b pb-6">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt={profile.companyName ?? ""} className="mx-auto mb-6 h-14 object-contain" />
          ) : null}
        </div>

        <div className="mt-8 flex items-start gap-6">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.fullName} className="h-24 w-24 rounded-md object-cover" />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-md text-2xl font-bold text-white" style={{ background: accent }}>
              {profile.fullName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{profile.fullName}</h1>
            {profile.jobTitle ? <p className="text-sm text-slate-700">{profile.jobTitle}</p> : null}
            {profile.companyName ? <p className="text-sm font-medium" style={{ color: accent }}>{profile.companyName}</p> : null}
          </div>
        </div>

        {profile.description ? (
          <p className="mt-6 border-l-2 pl-4 text-sm leading-relaxed text-slate-700" style={{ borderColor: accent }}>
            {profile.description}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Contacto</h2>
            <ContactActions profile={profile} accent={accent} />
          </div>
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Enlaces</h2>
            <LinkList links={links} variant="corporate" />
          </div>
        </div>

        <footer className="mt-16 border-t pt-6 text-center text-xs text-slate-400">
          Powered by Volt Cards
        </footer>
      </div>
    </main>
  );
}
