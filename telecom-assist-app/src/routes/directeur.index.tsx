import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Inbox, AlertTriangle, Building2, CheckCircle2 } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { courriersApi, type Courrier, type DashboardStatsData } from "@/lib/api";
import { PriorityBadge } from "@/components/StatusBadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["oklch(0.577 0.245 27.66)", "oklch(0.715 0.143 215.221)", "oklch(0.627 0.194 149.214)"];

export const Route = createFileRoute("/directeur/")({
  component: DirecteurPage,
});

function DirecteurPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [prio, setPrio] = useState("");
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courriersApi.getPendingForDirector(),
      courriersApi.getStats(),
    ])
      .then(([list, s]) => { setCourriers(list); setStats(s); })
      .catch(() => { setCourriers([]); setStats(null); })
      .finally(() => setLoading(false));
  }, []);

  const data = courriers.filter(c => !prio || c.priorite?.toLowerCase() === prio);

  const hautesPrio = courriers.filter(c => c.priorite === "HAUTE");
  const sansService = courriers.filter(c => !c.service);
  const traitesMois = stats ? (stats.byStatut.TRAITE ?? 0) : 0;

  const cards = [
    { label: t("directeur.enAttente"), value: courriers.length, icon: <Inbox className="h-5 w-5" />, color: "bg-primary-bright/15 text-primary-bright" },
    { label: t("directeur.hautePriorite"), value: hautesPrio.length, icon: <AlertTriangle className="h-5 w-5" />, color: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
    { label: t("directeur.nonAffecte"), value: sansService.length, icon: <Building2 className="h-5 w-5" />, color: "bg-ai/30 text-amber-700" },
    { label: t("directeur.traites") || "Traités", value: traitesMois, icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success/15 text-teal-700" },
  ];

  const priorityData = [
    { name: t("directeur.haute") || "Haute", value: hautesPrio.length },
    { name: t("directeur.moyenne") || "Moyenne", value: courriers.filter(c => c.priorite === "MOYENNE").length },
    { name: t("directeur.basse") || "Basse", value: courriers.filter(c => c.priorite === "BASSE").length },
  ].filter(d => d.value > 0);

  const cols: Column<Courrier>[] = [
    { key: "reference", header: t("directeur.reference"), render: r => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "objet", header: t("directeur.objet"), render: r => <span className="font-medium">{r.objet}</span> },
    { key: "correspondant", header: t("directeur.expediteur"), render: r => <span className="text-sm">{r.correspondant || "-"}</span> },
    { key: "service", header: t("directeur.serviceAffecte"), render: r => (
      r.service ? <span className="inline-flex rounded-md bg-info/12 text-info px-2 py-0.5 text-xs font-medium">{r.service.name}</span> : <span className="text-xs text-muted-foreground">{t("directeur.nonAffecte")}</span>
    )},
    { key: "priorite", header: t("directeur.priorite"), render: r => <PriorityBadge priority={r.priorite?.toLowerCase() as any} /> },
    { key: "action", header: "", render: r => (
      <button
        onClick={(e) => { e.stopPropagation(); navigate({ to: "/directeur/courrier/$id", params: { id: r._id } }); }}
        className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium"
      >{t("directeur.traiter")}</button>
    ), className: "text-right" },
  ];

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{t("directeur.loading")}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">{t("directeur.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("directeur.desc")}</p>
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

      {priorityData.length > 0 && (
        <div className="rounded-xl bg-card border p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">{t("directeur.repartitionPriorite") || "Répartition par priorité"}</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <DataTable
        data={data}
        columns={cols}
        rowKey={r => r._id}
        searchKeys={["reference","objet","correspondant"]}
        onRowClick={(r) => navigate({ to: "/directeur/courrier/$id", params: { id: r._id } })}
        filters={
          <select value={prio} onChange={e => setPrio(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">{t("directeur.allPriorities")}</option>
            <option value="haute">{t("directeur.haute")}</option>
            <option value="moyenne">{t("directeur.moyenne")}</option>
            <option value="basse">{t("directeur.basse")}</option>
          </select>
        }
      />
    </div>
  );
}
