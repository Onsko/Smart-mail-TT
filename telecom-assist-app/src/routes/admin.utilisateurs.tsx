import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, type Column } from "@/components/DataTable";
import { usersApi, servicesApi, type ApiUser, type CreateUserPayload, type Service } from "@/lib/api";
import { Plus, X, MoreHorizontal, UserCheck, UserX, ShieldCheck, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/utilisateurs")({
  component: UtilisateursPage,
});

const ROLES = ["BO", "DIRECTEUR", "CHEF", "AGENT"] as const;
const ASSIGNABLE_ROLES = ["BO", "DIRECTEUR", "CHEF", "AGENT", "SUPER_ADMIN"] as const;
const ALL_ROLES = ["BO", "DIRECTEUR", "CHEF", "AGENT", "CLIENT", "SUPER_ADMIN"] as const;

function UtilisateursPage() {
  const { t } = useTranslation();
  const [openCreate, setOpenCreate] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CreateUserPayload>({ nom: "", prenom: "", email: "", password: "", role: "BO", service: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function loadUsers() {
    setLoadingList(true);
    setListError("");
    usersApi.getAll()
      .then(data => setUsers(data))
      .catch(() =>     setListError(t("admin.loadError")))
      .finally(() => setLoadingList(false));
  }

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { servicesApi.getAll().then(setServices).catch(() => {}); }, []);

  // Fermer le menu si clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = users.filter(u => !roleFilter || u.role === roleFilter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload: CreateUserPayload = { ...form };
      if (!payload.service) delete payload.service;
      const created = await usersApi.create(payload);
      setUsers(prev => [...prev, created]);
      showToast(`✓ ${created.prenom} ${created.nom} ${t("admin.createSuccess")}`);
      setForm({ nom: "", prenom: "", email: "", password: "", role: "BO", service: "" });
      setOpenCreate(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("admin.createError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(user: ApiUser) {
    setActionMenu(null);
    try {
      const updated = await usersApi.updateStatus(user._id, !user.actif);
      setUsers(prev => prev.map(u => u._id === user._id ? updated : u));
      showToast(`✓ ${user.prenom} ${user.nom} ${updated.actif ? t("admin.activate") : t("admin.deactivate")}`);
    } catch { showToast(t("admin.statusError")); }
  }

  async function handleChangeRole(user: ApiUser, role: string) {
    setActionMenu(null);
    try {
      const updated = await usersApi.updateRole(user._id, role);
      setUsers(prev => prev.map(u => u._id === user._id ? updated : u));
      showToast(`✓ ${t("admin.role")} ${user.prenom} ${user.nom} changé en ${role}`);
    } catch { showToast(t("admin.roleError")); }
  }

  async function handleDelete(user: ApiUser) {
    setActionMenu(null);
    if (!confirm(`${t("admin.deleteConfirm")} ${user.prenom} ${user.nom} ?`)) return;
    try {
      await usersApi.delete(user._id);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      showToast(`✓ ${user.prenom} ${user.nom} ${t("admin.deleteSuccess")}`);
    } catch { showToast(t("admin.deleteError")); }
  }

  const cols: Column<ApiUser>[] = [
    { key: "nom", header: t("admin.name"), render: r => (
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold
          ${r.actif ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {`${r.prenom[0] ?? ""}${r.nom[0] ?? ""}`.toUpperCase()}
        </div>
        <div>
          <div className="font-medium">{r.prenom} {r.nom}</div>
          <div className="text-xs text-muted-foreground">{r.email}</div>
        </div>
      </div>
    )},
    { key: "role", header: t("admin.role"), render: r => (
      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium
        ${r.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-700" :
          r.role === "DIRECTEUR" ? "bg-blue-100 text-blue-700" :
          r.role === "CHEF" ? "bg-indigo-100 text-indigo-700" :
          r.role === "BO" ? "bg-orange-100 text-orange-700" :
          r.role === "AGENT" ? "bg-cyan-100 text-cyan-700" :
          "bg-gray-100 text-gray-700"}`}>
        {r.role}
      </span>
    )},
    { key: "service", header: t("admin.service"), render: r => {
      const svc = typeof r.service === 'object' && r.service ? r.service : null;
      return <span className="text-sm">{svc ? `${svc.name} (${svc.code})` : "—"}</span>;
    } },
    { key: "actif", header: t("admin.status"), render: r => (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset
        ${r.actif ? "bg-success/15 text-teal-700 ring-success/40" : "bg-muted text-muted-foreground ring-border"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {r.actif ? t("admin.actif") : t("admin.inactif")}
      </span>
    )},
    { key: "actions", header: "", render: r => (
      <div className="flex justify-end" ref={actionMenu === r._id ? menuRef : undefined}>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === r._id ? null : r._id); }}
            className="rounded-md p-1.5 hover:bg-accent"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {actionMenu === r._id && (
            <div className="absolute right-0 top-8 z-50 w-52 rounded-lg border bg-card shadow-lg overflow-hidden">
              <div className="py-1">
                <button
                  onClick={() => handleToggleStatus(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent"
                >
                  {r.actif ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-teal-600" />}
                  {r.actif ? t("admin.deactivate") : t("admin.activate")}
                </button>
                <div className="px-3 py-1.5">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {t("admin.changeRole")}</p>
                  <select
                    defaultValue={r.role}
                    onChange={e => handleChangeRole(r, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="w-full rounded border bg-background px-2 py-1 text-xs"
                  >
                    {r.role === "CLIENT" && (
                      <option value="CLIENT" disabled>CLIENT</option>
                    )}
                    {ASSIGNABLE_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t mt-1 pt-1">
                  <button
                    onClick={() => handleDelete(r)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" /> {t("admin.deleteAccount")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    ), className: "text-right" },
  ];

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-card border shadow-lg px-4 py-3 text-sm font-medium animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">{t("admin.usersTitle")}</h2>
          <p className="text-sm text-muted-foreground">{users.length} {t("admin.usersCount")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadUsers} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95">
            <Plus className="h-4 w-4" /> {t("admin.newUser")}
          </button>
        </div>
      </div>

      {listError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{listError}</div>
      )}

      {loadingList ? (
        <div className="text-sm text-muted-foreground py-10 text-center">{t("admin.loading")}</div>
      ) : (
        <DataTable
          data={filtered}
          columns={cols}
          rowKey={(r) => r._id}
          searchKeys={["nom", "email", "prenom"]}
          filters={
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">{t("admin.allRoles")}</option>
              {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          }
        />
      )}

      {openCreate && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenCreate(false)} />
          <div className="relative ml-auto h-full w-full max-w-md bg-card shadow-2xl flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">{t("admin.createTitle")}</h3>
              <button onClick={() => setOpenCreate(false)} className="p-1.5 rounded-md hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form className="p-5 space-y-4 overflow-y-auto flex-1" onSubmit={handleCreate}>
              <div className="grid grid-cols-2 gap-3">
                <Input label={t("admin.firstName")} placeholder={t("admin.firstName")} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} required />
                <Input label={t("admin.lastName")} placeholder={t("admin.lastName")} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
              </div>
              <Input label={t("admin.email")} type="email" placeholder={t("admin.emailPlaceholder")} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input label={t("admin.password")} type="password" placeholder={t("admin.passwordMin")} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("admin.roleLabel")}</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full rounded-md border bg-card px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("admin.serviceLabel")} {(form.role === "CHEF" || form.role === "AGENT") && <span className="text-destructive">*</span>}</label>
                <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className="w-full rounded-md border bg-card px-3 py-2 text-sm">
                  <option value="">—</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              {formError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{formError}</div>
              )}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpenCreate(false)} className="rounded-md border px-4 py-2 text-sm">{t("common.cancel")}</button>
                <button type="submit" disabled={submitting} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60">
                  {submitting ? t("admin.saving") : t("admin.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input {...rest} className="w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
