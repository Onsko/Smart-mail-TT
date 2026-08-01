import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Inbox, Send, Clock, CheckCircle2 } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { courriersApi, type Courrier, type DashboardStatsData, type ActivityByTypeDay } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/bo/")({
  component: BoDashboard,
});

function BoDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courriersApi.getStats(),
      courriersApi.getAll(),
    ])
      .then(([s, c]) => { setStats(s); setCourriers(c); })
      .catch(() => { setStats(null); setCourriers([]); })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: t("bo.dashboard.entrants"),   value: stats.byType.ENTRANT ?? 0, icon: <Inbox className="h-5 w-5" />,        color: "bg-primary-bright/15 text-primary-bright" },
    { label: t("bo.dashboard.sortants"),   value: stats.byType.SORTANT ?? 0, icon: <Send className="h-5 w-5" />,         color: "bg-info/15 text-info" },
    { label: t("bo.dashboard.enAttente"), value: (stats.byStatut.A_TRAITER ?? 0) + (stats.byStatut.EN_COURS ?? 0), icon: <Clock className="h-5 w-5" />,        color: "bg-ai/30 text-amber-700" },
    { label: t("bo.dashboard.traites"),    value: stats.byStatut.TRAITE ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success/15 text-teal-700" },
  ] : [];

  const cols: Column<Courrier>[] = [
    { key: "reference", header: t("bo.dashboard.reference"), render: r => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "objet", header: t("bo.dashboard.objet"), render: r => <span className="font-medium">{r.objet}</span> },
    { key: "correspondant", header: t("bo.dashboard.expediteur"), render: r => <span>{r.correspondant || "-"}</span> },
    { key: "date", header: t("bo.dashboard.date"), render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-" },
    { key: "statut", header: t("bo.dashboard.statut"), render: r => <StatusBadge status={r.statut?.toLowerCase() as any} /> },
  ];

  const chartData: { name: string; entrants: number; sortants: number }[] = (stats?.activityByDay ?? []).map((d: ActivityByTypeDay) => ({
    name: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
    entrants: d.entrants,
    sortants: d.sortants,
  }));

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{t("bo.dashboard.loading") || "Chargement..."}</div>;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(s => (
          <div key={s.label} className="rounded-xl bg-card border p-5 shadow-sm">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div className="mt-4 text-2xl font-display font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl bg-card border p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">{t("bo.dashboard.chartTitle") || "Activité 7 derniers jours"}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrants" name={t("bo.dashboard.entrants")} fill="oklch(0.546 0.245 262.881)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sortants" name={t("bo.dashboard.sortants")} fill="oklch(0.716 0.143 215.221)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{t("bo.dashboard.recentMails")}</h3>
        <div className="flex gap-2">
          <Link to="/bo/courrier-entrant" className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm">{t("bo.dashboard.newIncoming")}</Link>
          <Link to="/bo/courrier-sortant" className="rounded-md border px-3 py-2 text-sm">{t("bo.dashboard.newOutgoing")}</Link>
        </div>
      </div>
      <DataTable data={courriers} columns={cols} rowKey={r => r._id} searchKeys={["reference","objet","correspondant"]} />
    </div>
  );
}
