import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { COURRIERS, type Courrier } from "@/lib/mockData";
import { PriorityBadge } from "@/components/StatusBadge";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/directeur/")({
  component: DirecteurPage,
});

function DirecteurPage() {
  const navigate = useNavigate();
  const [prio, setPrio] = useState("");
  const data = COURRIERS.filter(c => !prio || c.priorite === prio);
  const cols: Column<Courrier>[] = [
    { key: "ref", header: "Référence", render: r => <span className="font-mono text-xs">{r.ref}</span> },
    { key: "objet", header: "Objet", render: r => <span className="font-medium">{r.objet}</span> },
    { key: "resumeIA", header: "Résumé IA", render: r => (
      <div className="flex items-start gap-2 max-w-md">
        <Sparkles className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground line-clamp-2 text-xs">{r.resumeIA}</span>
      </div>
    )},
    { key: "serviceSuggere", header: "Service suggéré", render: r => (
      <span className="inline-flex rounded-md bg-info/12 text-info px-2 py-0.5 text-xs font-medium">{r.serviceSuggere}</span>
    )},
    { key: "priorite", header: "Priorité", render: r => <PriorityBadge priority={r.priorite} /> },
    { key: "action", header: "", render: r => (
      <button
        onClick={(e) => { e.stopPropagation(); navigate({ to: "/directeur/affectation/$id", params: { id: r.id } }); }}
        className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium"
      >Affecter</button>
    ), className: "text-right" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Courriers à affecter</h2>
        <p className="text-sm text-muted-foreground">Les suggestions IA accélèrent l'orientation vers le bon service.</p>
      </div>
      <DataTable
        data={data}
        columns={cols}
        rowKey={r => r.id}
        searchKeys={["ref","objet","expediteur"]}
        onRowClick={(r) => navigate({ to: "/directeur/courrier/$id", params: { id: r.id } })}
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
