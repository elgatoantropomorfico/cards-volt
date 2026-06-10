"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type Variant = "default" | "success" | "error";
type Toast = { id: number; title: string; description?: string; variant?: Variant };
type Ctx = { push: (t: Omit<Toast, "id">) => void };

const ToastCtx = React.createContext<Ctx | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) return { push: () => {} };
  return ctx;
}

let _push: ((t: Omit<Toast, "id">) => void) | null = null;
export function toast(t: Omit<Toast, "id">) {
  _push?.(t);
}

const variants: Record<Variant, { ring: string; icon: React.ReactNode; bg: string }> = {
  default: { ring: "ring-border", icon: <Info className="h-4 w-4 text-foreground/70" />, bg: "" },
  success: {
    ring: "ring-emerald-200/80 dark:ring-emerald-900/60",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    bg: "bg-gradient-to-br from-emerald-50/80 to-transparent dark:from-emerald-950/40",
  },
  error: {
    ring: "ring-rose-200/80 dark:ring-rose-900/60",
    icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
    bg: "bg-gradient-to-br from-rose-50/80 to-transparent dark:from-rose-950/40",
  },
};

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  React.useEffect(() => {
    _push = push;
    return () => {
      _push = null;
    };
  }, [push]);

  return (
    <ToastCtx.Provider value={{ push }}>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => {
          const v = variants[t.variant || "default"];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative flex items-start gap-3 rounded-2xl border bg-popover p-3.5 pr-9 text-popover-foreground shadow-pop ring-1 ${v.ring} ${v.bg} animate-fade-up`}
            >
              <div className="mt-0.5">{v.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{t.description}</p> : null}
              </div>
              <button
                aria-label="Cerrar"
                className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
