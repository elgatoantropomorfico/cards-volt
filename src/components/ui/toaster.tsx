"use client";

import * as React from "react";

type Toast = { id: number; title: string; description?: string; variant?: "default" | "success" | "error" };
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

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  React.useEffect(() => {
    _push = push;
    return () => {
      _push = null;
    };
  }, [push]);

  return (
    <ToastCtx.Provider value={{ push }}>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto min-w-[260px] max-w-sm rounded-lg border bg-card p-4 shadow-lg " +
              (t.variant === "error"
                ? "border-destructive"
                : t.variant === "success"
                  ? "border-emerald-500"
                  : "")
            }
          >
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description ? <p className="mt-1 text-xs text-muted-foreground">{t.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
