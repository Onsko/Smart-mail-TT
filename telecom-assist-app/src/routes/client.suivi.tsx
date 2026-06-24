import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Download, Clock, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/client/suivi")({
  component: SuiviPage,
});

const STEPS = [
  { t: "Réceptionné par le Bureau d'Ordre", date: "18/06/2026", done: true },
  { t: "Analysé par l'IA", date: "18/06/2026", done: true },
  { t: "Affecté au service Technique", date: "19/06/2026", done: true },
  { t: "En cours de traitement", date: "20/06/2026", done: true, current: true },
  { t: "Réponse envoyée", date: "—", done: false },
];

function SuiviPage() {
  const [ref, setRef] = useState("");
  const [found, setFound] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Suivi de votre courrier</h2>
        <p className="text-sm text-muted-foreground">Entrez la référence reçue lors du dépôt.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setFound(!!ref); }} className="rounded-2xl bg-card border shadow-sm p-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={ref}
            onChange={e => setRef(e.target.value)}
            placeholder="Ex : TT-2026-0420"
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="rounded-md bg-primary text-primary-foreground px-5 text-sm font-semibold">Rechercher</button>
      </form>

      {found && (
        <div className="rounded-2xl bg-card border shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-mono text-muted-foreground">{ref || "TT-2026-0420"}</div>
              <div className="font-semibold mt-1">Demande de raccordement fibre</div>
            </div>
            <StatusBadge status="en_cours" />
          </div>

          <ol className="space-y-4">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-white shrink-0
                  ${s.done ? (s.current ? "bg-primary-bright animate-pulse" : "bg-success") : "bg-muted text-muted-foreground"}`}>
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${s.done ? "" : "text-muted-foreground"}`}>{s.t}</div>
                  <div className="text-xs text-muted-foreground">{s.date}</div>
                </div>
              </li>
            ))}
          </ol>

          <button
            disabled
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium text-muted-foreground"
          >
            <Download className="h-4 w-4" /> Réponse PDF (indisponible)
          </button>
        </div>
      )}
    </div>
  );
}
