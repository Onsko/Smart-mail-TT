import { createFileRoute } from "@tanstack/react-router";
import { AGENTS_SERVICE } from "@/lib/mockData";
import { Sparkles, Wand2 } from "lucide-react";

export const Route = createFileRoute("/chef/affectation-agent")({
  component: AffectationAgentPage,
});

function AffectationAgentPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Affectation à un agent</h2>
          <p className="text-sm text-muted-foreground">Sélectionnez un agent du service Technique pour ce courrier.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border-2 border-ai bg-ai/15 text-amber-800 px-4 py-2 text-sm font-semibold hover:bg-ai/25">
          <Wand2 className="h-4 w-4" /> Auto-assign
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS_SERVICE.map(a => {
          const pct = Math.min(100, (a.charge / 10) * 100);
          const heavy = a.charge >= 7;
          return (
            <div
              key={a.id}
              className={`rounded-xl bg-card border shadow-sm p-5 relative
                ${a.recommended ? "ring-2 ring-ai border-ai/60" : ""}`}
            >
              {a.recommended && (
                <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-ai text-amber-900 text-[10px] font-semibold px-2 py-0.5">
                  <Sparkles className="h-3 w-3" /> Recommandé par l'IA
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {a.nom.split(" ").map(s => s[0]).slice(0,2).join("")}
                </div>
                <div>
                  <div className="font-semibold">{a.nom}</div>
                  <div className="text-xs text-muted-foreground">Service Technique</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Charge actuelle</span>
                  <span className={`font-medium ${heavy ? "text-orange-600" : "text-teal-600"}`}>{a.charge} courriers</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${heavy ? "bg-prio-high" : "bg-success"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <button className="mt-4 w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium">Assigner</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
