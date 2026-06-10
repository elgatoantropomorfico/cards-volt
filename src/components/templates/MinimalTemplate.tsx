import type { Link as LinkRow, Profile } from "@prisma/client";
import { ContactActions } from "./actions";
import { LinkList } from "./LinkList";

export function MinimalTemplate({ profile, links }: { profile: Profile; links: LinkRow[] }) {
  const accent = profile.primaryColor || "#0F172A";
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center px-6 text-center">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt={profile.fullName} className="h-28 w-28 rounded-full object-cover shadow-md ring-4 ring-white" />
        ) : (
          <div className="grid h-28 w-28 place-items-center rounded-full bg-slate-900 text-2xl font-semibold text-white shadow-md ring-4 ring-white">
            {profile.fullName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="mt-6 text-2xl font-bold text-slate-900">{profile.fullName}</h1>
        {profile.jobTitle ? <p className="text-sm text-slate-600">{profile.jobTitle}</p> : null}
        {profile.companyName ? <p className="text-sm font-medium" style={{ color: accent }}>{profile.companyName}</p> : null}
        {profile.description ? <p className="mt-4 text-sm leading-relaxed text-slate-600">{profile.description}</p> : null}

        <div className="mt-8 w-full"><ContactActions profile={profile} accent={accent} /></div>
        <div className="mt-6 w-full"><LinkList links={links} variant="minimal" /></div>

        <footer className="mt-10 text-xs text-slate-400">Powered by Volt Cards</footer>
      </div>
    </main>
  );
}
