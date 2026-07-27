import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, type Column } from "@/components/DataTable";
import { courriersApi, type Courrier } from "@/lib/api";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/agent/")({
  component: AgentPage,
});

function AgentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statut, setStatut] = useState("");
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courriersApi.getAgentCourriers()
      .then(setCourriers)
      .catch(() => setCourriers([]))
      .finally(() => setLoading(false));
  }, []);

  const data = courriers.filter(c => !statut || c.statut === statut);

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
