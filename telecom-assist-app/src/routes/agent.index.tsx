import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { courriersApi, type Courrier, type AgentDashboardStatsData } from "@/lib/api";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["oklch(0.577 0.245 27.66)", "oklch(0.627 0.194 149.214)", "oklch(0.546 0.245 262.881)", "oklch(0.715 0.143 215.221)", "oklch(0.707 0.165 56.017)"];

export const Route = createFileRoute("/agent/")({
  component: AgentPage,
});

function AgentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statut, setStatut] = useState("");
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [agentStats, setAgentStats] = useState<AgentDashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courriersApi.getAgentCourriers(),
      courriersApi.getAgentStats(),
    ])
      .then(([c, s]) => { setCourriers(c); setAgentStats(s); })
      .catch(() => { setCourriers([]); setAgentStats(null); })
      .finally(() => setLoading(false));
  }, []);

  const data = courriers.filter(c => !statut || c.statut === statut);

  const cards = agentStats ? [
    { label: t("agent.totalAssignes") || "Total assignés", value: agentStats.total, icon: <ClipboardList className="h-5 w-5" />, color: "bg-primary-bright/15 text-primary-bright" },
    { label: t("agent.enCours"), value: agentStats.byStatut.EN_COURS ?? 0, icon: <Clock className="h-5 w-5" />, color: "bg-info/15 text-info" },
    { label: t("agent.traite"), value: agentStats.byStatut.TRAITE ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success/15 text-teal-700" },
    { label: t("agent.urgent") || "Urgent", value: agentStats.byPriorite.HAUTE ?? 0, icon: <AlertTriangle className="h-5 w-5" />, color: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
  ] : [];

  const statutData = agentStats ? Object.entries(agentStats.byStatut)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: t(`agent.${k.toLowerCase()}` as any) || k, value: v })) : [];

  const cols: Column<Courrier>[] = [
    { key: "reference", header: t("agent.reference"), render: r => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "objet", header: t("agent.objet"), render: r => <span className="font-medium">{r.objet}</span> },
    { key: "correspondant", header: t("agent.expediteur") },
    { key: "priorite", header: t("agent.priorite"), render: r => <PriorityBadge priority={r.priorite?.toLowerCase() as any} /> },
    { key: "statut", header: t("agent.statut"), render: r => <StatusBadge status={r.statut?.toLowerCase() as any} /> },
  ];

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{t("agent.loading")}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">{t("agent.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("agent.desc")}</p>
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

      {statutData.length > 0 && (
        <div className="rounded-xl bg-card border p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">{t("agent.repartitionStatut") || "Répartition par statut"}</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statutData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
        onRowClick={r => navigate({ to: "/agent/courrier/$id", params: { id: r._id } })}
        filters={
          <select value={statut} onChange={e => setStatut(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">{t("agent.allStatus")}</option>
            <option value="EN_COURS">{t("agent.enCours")}</option>
            <option value="EN_ATTENTE">{t("agent.enAttente")}</option>
            <option value="TRAITE">{t("agent.traite")}</option>
            <option value="CLOTURE">{t("agent.cloture")}</option>
          </select>
        }
      />
    </div>
  );
}
