import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList, Clock, CheckCircle2, Users } from "lucide-react";
import { courriersApi, type Courrier, type ChefDashboardStatsData } from "@/lib/api";
import { PriorityBadge } from "@/components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/chef/")({
  component: KanbanPage,
});

function KanbanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const COLUMNS = [
    { key: "A_TRAITER", title: t("chef.aTraiter"), color: "bg-primary-bright" },
    { key: "EN_COURS",  title: t("chef.enCours"),  color: "bg-ai" },
    { key: "TRAITE",    title: t("chef.traites"),   color: "bg-success" },
  ] as const;
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [chefStats, setChefStats] = useState<ChefDashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courriersApi.getChefCourriers(),
      courriersApi.getChefStats(),
    ])
      .then(([c, s]) => { setCourriers(c); setChefStats(s); })
      .catch(() => { setCourriers([]); setChefStats(null); })
      .finally(() => setLoading(false));
  }, []);

  const cards = chefStats ? [
    { label: t("chef.totalService") || "Total service", value: chefStats.total, icon: <ClipboardList className="h-5 w-5" />, color: "bg-primary-bright/15 text-primary-bright" },
    { label: t("chef.aTraiter"), value: chefStats.byStatut.A_TRAITER ?? 0, icon: <Clock className="h-5 w-5" />, color: "bg-ai/30 text-amber-700" },
    { label: t("chef.enCours"), value: chefStats.byStatut.EN_COURS ?? 0, icon: <Users className="h-5 w-5" />, color: "bg-info/15 text-info" },
    { label: t("chef.traites"), value: chefStats.byStatut.TRAITE ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success/15 text-teal-700" },
  ] : [];

  const chargeData = (chefStats?.agentsCharge ?? []).map(a => ({
    name: a.prenom,
    charge: a.charge,
    recommandé: a.recommended,
  }));

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{t("chef.loading")}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">{t("chef.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("chef.desc")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(s => (
          <div key={s.label} className="rounded-xl bg-card border p-5 shadow-sm">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div className="mt-4 text-2xl font-display font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {chargeData.length > 0 && (
        <div className="rounded-xl bg-card border p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">{t("chef.chargeTitle") || "Charge par agent"}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chargeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="charge" name={t("chef.nombreCourriers") || "Courriers actifs"} fill="oklch(0.546 0.245 262.881)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const items = courriers.filter(c => c.statut === col.key);
          return (
            <div key={col.key} className="rounded-xl bg-card border shadow-sm flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-sm">{col.title}</h3>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[200px]">
                {items.map(c => (
                  <button
                    key={c._id}
                    onClick={() => navigate({ to: "/chef/affectation-agent", search: { courrierId: c._id } })}
                    className="w-full text-left rounded-lg border bg-card p-3 hover:shadow-md hover:border-primary-bright/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground">{c.reference}</span>
                      <PriorityBadge priority={c.priorite?.toLowerCase() as any} />
                    </div>
                    <div className="mt-1.5 text-sm font-medium line-clamp-2">{c.objet}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.correspondant}</div>
                  </button>
                ))}
                {items.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">{t("chef.empty")}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
