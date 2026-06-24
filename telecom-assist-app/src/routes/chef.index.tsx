import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { COURRIERS, type Courrier } from "@/lib/mockData";
import { PriorityBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/chef/")({
  component: KanbanPage,
});

const COLUMNS: { key: Courrier["statut"]; title: string; color: string }[] = [
  { key: "nouveau",   title: "Nouveaux",  color: "bg-primary-bright" },
  { key: "en_cours",  title: "En cours",  color: "bg-ai" },
  { key: "traite",    title: "Traités",   color: "bg-success" },
];

function KanbanPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Kanban — Service Technique</h2>
        <p className="text-sm text-muted-foreground">Vue d'ensemble des courriers du service.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const items = COURRIERS.filter(c => c.statut === col.key);
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
                    key={c.id}
                    onClick={() => navigate({ to: "/agent/courrier/$id", params: { id: c.id } })}
                    className="w-full text-left rounded-lg border bg-card p-3 hover:shadow-md hover:border-primary-bright/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground">{c.ref}</span>
                      <PriorityBadge priority={c.priorite} />
                    </div>
                    <div className="mt-1.5 text-sm font-medium line-clamp-2">{c.objet}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.expediteur}</div>
                  </button>
                ))}
                {items.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">Aucun courrier</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
