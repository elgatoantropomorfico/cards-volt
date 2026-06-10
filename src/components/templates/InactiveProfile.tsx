import { Moon } from "lucide-react";

export function InactiveProfile({ name }: { name: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background p-6">
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      <div className="relative max-w-md rounded-3xl border bg-card/80 p-10 text-center shadow-pop backdrop-blur">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Moon className="h-6 w-6" />
        </div>
        <h1 className="font-display mt-5 text-xl font-semibold tracking-tight">{name || "Este perfil"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Este perfil no se encuentra disponible actualmente.</p>
      </div>
    </main>
  );
}
