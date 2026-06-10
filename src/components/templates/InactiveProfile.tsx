import { Moon } from "lucide-react";

export function InactiveProfile({ name }: { name: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-500">
          <Moon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{name || "Este perfil"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Este perfil no se encuentra disponible actualmente.
        </p>
      </div>
    </main>
  );
}
