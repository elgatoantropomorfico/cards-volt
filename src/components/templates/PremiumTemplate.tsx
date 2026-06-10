import type { Link as LinkRow, Profile } from "@prisma/client";
import { ContactActions } from "./actions";
import { LinkList } from "./LinkList";

export function PremiumTemplate({ profile, links }: { profile: Profile; links: LinkRow[] }) {
  const accent = profile.primaryColor || "#7C3AED";
  const gradient = `linear-gradient(135deg, ${accent} 0%, #0F172A 100%)`;

  return (
    <main className="min-h-screen bg-slate-950 pb-16">
      <div className="relative">
        <div className="h-56 w-full" style={{ background: profile.coverUrl ? `url(${profile.coverUrl}) center/cover` : gradient }} />
        <div className="absolute inset-x-0 -bottom-14 flex justify-center">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.fullName} className="h-28 w-28 rounded-2xl object-cover shadow-2xl ring-4 ring-slate-950" />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-2xl bg-white text-2xl font-bold text-slate-900 shadow-2xl ring-4 ring-slate-950">
              {profile.fullName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-md px-6 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight">{profile.fullName}</h1>
        {profile.jobTitle ? <p className="mt-1 text-sm text-slate-300">{profile.jobTitle}</p> : null}
        {profile.companyName ? <p className="text-sm font-semibold" style={{ color: accent }}>{profile.companyName}</p> : null}
        {profile.description ? <p className="mt-4 text-sm leading-relaxed text-slate-300">{profile.description}</p> : null}

        <div className="mt-8 w-full"><ContactActions profile={profile} accent={accent} /></div>
        <div className="mt-6 w-full"><LinkList links={links} variant="premium" /></div>

        <footer className="mt-10 text-xs text-slate-500">Powered by Volt Cards</footer>
      </div>
    </main>
  );
}
