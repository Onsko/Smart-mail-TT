import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { COURRIERS, SERVICES } from "@/lib/mockData";
import { Sparkles, Wand2 } from "lucide-react";

export const Route = createFileRoute("/directeur/affectation/$id")({
  component: AffectationPage,
});

function AffectationPage() {
  const { id } = Route.useParams();
  const c = COURRIERS.find(x => x.id === id) ?? COURRIERS[0];
  const [service, setService] = useState(c.serviceSuggere);
  const [priorite, setPriorite] = useState(c.prioriteSuggere);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="text-xs font-mono text-muted-foreground">{c.ref}</div>
        <h2 className="font-display text-2xl font-semibold">Affectation du courrier</h2>
        <p className="text-sm text-muted-foreground mt-1">{c.objet}</p>
      </div>

      <div className="rounded-xl border bg-ai-tint p-4 flex items-start gap-3 text-sm">
        <Sparkles className="h-5 w-5 text-amber-700 mt-0.5" />
        <div>
          <div className="font-medium">Suggestion IA</div>
          <div className="text-muted-foreground">Service <b>{c.serviceSuggere}</b> · Priorité <b className="capitalize">{c.prioriteSuggere}</b> — les champs sont pré-remplis.</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
        <div>
          <label className="text-sm font-medium block mb-1.5">Service</label>
          <select value={service} onChange={e => setService(e.target.value as any)} className="w-full rounded-md border bg-card px-3 py-2 text-sm">
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Priorité</label>
          <div className="grid grid-cols-3 gap-2">
            {(["haute","moyenne","basse"] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorite(p)}
                className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition
                  ${priorite === p ? "border-primary-bright bg-primary-bright/10 text-primary-bright" : "hover:bg-accent"}`}
              >{p}</button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t flex flex-col sm:flex-row gap-2 justify-end">
          <button className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-ai bg-ai/15 text-amber-800 px-4 py-2.5 text-sm font-semibold hover:bg-ai/25">
            <Wand2 className="h-4 w-4" /> Affectation automatique
          </button>
          <button className="rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold">
            Affecter
          </button>
        </div>
      </div>
    </div>
  );
}
