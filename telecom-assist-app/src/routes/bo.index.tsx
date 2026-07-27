import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Inbox, Send, Clock, CheckCircle2 } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { COURRIERS, type Courrier } from "@/lib/mockData";

export const Route = createFileRoute("/bo/")({
  component: BoDashboard,
});

function BoDashboard() {
  const { t } = useTranslation();
  const stats = [
    { label: t("bo.dashboard.entrants"),   value: 87, icon: <Inbox className="h-5 w-5" />,        color: "bg-primary-bright/15 text-primary-bright" },
    { label: t("bo.dashboard.sortants"),   value: 42, icon: <Send className="h-5 w-5" />,         color: "bg-info/15 text-info" },
    { label: t("bo.dashboard.enAttente"), value: 16, icon: <Clock className="h-5 w-5" />,        color: "bg-ai/30 text-amber-700" },
    { label: t("bo.dashboard.traites"),    value: 113, icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-success/15 text-teal-700" },
  ];
  const cols: Column<Courrier>[] = [
    { key: "ref", header: t("bo.dashboard.reference"), render: r => <span className="font-mono text-xs">{r.ref}</span> },
    { key: "objet", header: t("bo.dashboard.objet"), render: r => <span className="font-medium">{r.objet}</span> },
    { key: "expediteur", header: t("bo.dashboard.expediteur") },
    { key: "date", header: t("bo.dashboard.date") },
    { key: "statut", header: t("bo.dashboard.statut"), render: r => <StatusBadge status={r.statut} /> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl bg-card border p-5 shadow-sm">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div className="mt-4 text-2xl font-display font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{t("bo.dashboard.recentMails")}</h3>
        <div className="flex gap-2">
          <Link to="/bo/courrier-entrant" className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm">{t("bo.dashboard.newIncoming")}</Link>
          <Link to="/bo/courrier-sortant" className="rounded-md border px-3 py-2 text-sm">{t("bo.dashboard.newOutgoing")}</Link>
        </div>
      </div>
      <DataTable data={COURRIERS} columns={cols} rowKey={r => r.id} searchKeys={["ref","objet","expediteur"]} />
    </div>
  );
}
