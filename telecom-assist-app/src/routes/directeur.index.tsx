import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { courriersApi, type Courrier } from "@/lib/api";
import { PriorityBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/directeur/")({
  component: DirecteurPage,
});

function DirecteurPage() {
  const navigate = useNavigate();
  const [prio, setPrio] = useState("");
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courriersApi.getPendingForDirector()
      .then(setCourriers)
      .catch(() => setCourriers([]))
      .finally(() => setLoading(false));
  }, []);

  const data = courriers.filter(c => !prio || c.priorite?.toLowerCase() === prio);

  const cols: Column<Courrier>[] = [
    { key: "reference", header: "Référence", render: r => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "objet", header: "Objet", render: r => <span className="font-medium">{r.objet}</span> },
    { key: "correspondant", header: "Expéditeur", render: r => <span className="text-sm">{r.correspondant || "-"}</span> },
    { key: "service", header: "Service affecté", render: r => (
      r.service ? <span className="inline-flex rounded-md bg-info/12 text-info px-2 py-0.5 text-xs font-medium">{r.service.name}</span> : <span className="text-xs text-muted-foreground">Non affecté</span>
    )},
    { key: "priorite", header: "Priorité", render: r => <PriorityBadge priority={r.priorite?.toLowerCase() as any} /> },
    { key: "action", header: "", render: r => (
      <button
        onClick={(e) => { e.stopPropagation(); navigate({ to: "/directeur/courrier/$id", params: { id: r._id } }); }}
        className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium"
      >Traiter</button>
    ), className: "text-right" },
  ];

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Courriers à affecter</h2>
        <p className="text-sm text-muted-foreground">Les suggestions IA accélèrent l'orientation vers le bon service.</p>
      </div>
      <DataTable
        data={data}
        columns={cols}
        rowKey={r => r._id}
        searchKeys={["reference","objet","correspondant"]}
        onRowClick={(r) => navigate({ to: "/directeur/courrier/$id", params: { id: r._id } })}
        filters={
          <select value={prio} onChange={e => setPrio(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">Toutes priorités</option>
            <option value="haute">Haute</option>
            <option value="moyenne">Moyenne</option>
            <option value="basse">Basse</option>
          </select>
        }
      />
    </div>
  );
}
