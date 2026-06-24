import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { COURRIERS, type Courrier } from "@/lib/mockData";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/agent/")({
  component: AgentPage,
});

function AgentPage() {
  const navigate = useNavigate();
  const [statut, setStatut] = useState("");
  const data = COURRIERS.filter(c => !statut || c.statut === statut);
  const cols: Column<Courrier>[] = [
    { key: "ref", header: "Référence", render: r => <span className="font-mono text-xs">{r.ref}</span> },
    { key: "objet", header: "Objet", render: r => <span className="font-medium">{r.objet}</span> },
    { key: "expediteur", header: "Expéditeur" },
    { key: "priorite", header: "Priorité", render: r => <PriorityBadge priority={r.priorite} /> },
    { key: "statut", header: "Statut", render: r => <StatusBadge status={r.statut} /> },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Mes courriers</h2>
        <p className="text-sm text-muted-foreground">Courriers qui vous sont assignés.</p>
      </div>
      <DataTable
        data={data}
        columns={cols}
        rowKey={r => r.id}
        searchKeys={["ref","objet","expediteur"]}
        onRowClick={r => navigate({ to: "/agent/courrier/$id", params: { id: r.id } })}
        filters={
          <select value={statut} onChange={e => setStatut(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">Tous statuts</option>
            <option value="en_cours">En cours</option>
            <option value="en_attente">En attente</option>
            <option value="traite">Traité</option>
          </select>
        }
      />
    </div>
  );
}
