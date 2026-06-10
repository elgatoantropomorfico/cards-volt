"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { deleteUser, setProfileActive } from "@/server/admin-actions";
import { CreateUserWizard } from "./CreateUserWizard";
import { EditUserDialog } from "./EditUserDialog";

type Row = {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "USER";
  profile: { id: string; slug: string; active: boolean } | null;
};

export function UsersManager({
  users,
  onChanged,
}: {
  users: Row[];
  onChanged?: () => void;
}) {
  const router = useRouter();
  const refresh = onChanged ?? (() => router.refresh());
  const [editUserId, setEditUserId] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Creá usuarios con el asistente o editá cuenta, contraseña, perfil y enlaces desde el lápiz.
        </p>
        <CreateUserWizard
          onCreated={refresh}
          trigger={
            <Button variant="gradient" size="lg">
              <Sparkles className="h-4 w-4" /> Nuevo usuario
            </Button>
          }
        />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <UserRow key={u.id} u={u} onChanged={refresh} onEdit={() => setEditUserId(u.id)} />
            ))}
            {!users.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No hay usuarios</td></tr>}
          </tbody>
        </table>
      </div>

      <EditUserDialog
        userId={editUserId}
        open={!!editUserId}
        onOpenChange={(open) => !open && setEditUserId(null)}
        onSaved={refresh}
      />
    </div>
  );
}

function UserRow({
  u,
  onChanged,
  onEdit,
}: {
  u: Row;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const [active, setActive] = React.useState(u.profile?.active ?? false);
  async function onToggle(v: boolean) {
    if (!u.profile) return;
    setActive(v);
    const res = await setProfileActive(u.profile.id, v);
    if (!res.ok) {
      setActive(!v);
      toast({ title: "Error", description: res.error, variant: "error" });
    }
  }
  async function onDelete() {
    if (!confirm(`Eliminar a ${u.email}?`)) return;
    const res = await deleteUser(u.id);
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else { toast({ title: "Usuario eliminado", variant: "success" }); onChanged(); }
  }
  return (
    <tr>
      <td className="px-4 py-3 font-medium">{u.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
      <td className="px-4 py-3"><Badge variant="outline">{u.role}</Badge></td>
      <td className="px-4 py-3">
        {u.profile ? (
          <Link href={`/${u.profile.slug}`} target="_blank" className="inline-flex items-center gap-1 hover:underline">
            /{u.profile.slug} <ExternalLink className="h-3 w-3" />
          </Link>
        ) : "—"}
      </td>
      <td className="px-4 py-3">
        {u.profile ? <Switch checked={active} onCheckedChange={onToggle} /> : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} title="Editar usuario">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Eliminar">
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
