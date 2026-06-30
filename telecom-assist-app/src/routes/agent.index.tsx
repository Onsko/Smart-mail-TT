import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { courriersApi, type Courrier } from "@/lib/api";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/agent/")({
  component: AgentPage,
});

function AgentPage() {
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
    { key: "reference", header: "Référence", render: r => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "objet", header: "Objet", render: r => <span className="font-medium">{r.objet}</span> },
    { key: "correspondant", header: "Expéditeur" },
    { key: "priorite", header: "Priorité", render: r => <PriorityBadge priority={r.priorite?.toLowerCase() as any} /> },
    { key: "statut", header: "Statut", render: r => <StatusBadge status={r.statut?.toLowerCase() as any} /> },
  ];

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Mes courriers</h2>
        <p className="text-sm text-muted-foreground">Courriers qui vous sont assignés.</p>
      </div>
      <DataTable
        data={data}
        columns={cols}
        rowKey={r => r._id}
        searchKeys={["reference","objet","correspondant"]}
        onRowClick={r => navigate({ to: "/agent/courrier/$id", params: { id: r._id } })}
        filters={
          <select value={statut} onChange={e => setStatut(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">Tous statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="TRAITE">Traité</option>
            <option value="CLOTURE">Clôturé</option>
          </select>
        }
      />
    </div>
  );
}
