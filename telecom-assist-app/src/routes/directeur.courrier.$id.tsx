import { createFileRoute, Link } from "@tanstack/react-router";
import { COURRIERS } from "@/lib/mockData";
import { AIPanel } from "@/components/AIPanel";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { FileText, Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/directeur/courrier/$id")({
  component: CourrierDetail,
});

function CourrierDetail() {
  const { id } = Route.useParams();
  const c = COURRIERS.find(x => x.id === id) ?? COURRIERS[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{c.ref}</div>
          <h2 className="font-display text-2xl font-semibold">{c.objet}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>De : {c.expediteur}</span>•<span>{c.date}</span>
            <StatusBadge status={c.statut} />
            <PriorityBadge priority={c.priorite} />
          </div>
        </div>
        <Link to="/directeur/affectation/$id" params={{ id: c.id }} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
          Affecter <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b">
            <FileText className="h-4 w-4" /> Aperçu du document
          </div>
          <div className="aspect-[4/5] bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_10px,#eef2f7_10px,#eef2f7_20px)] flex items-center justify-center text-muted-foreground text-sm">
            Aperçu PDF / Image
          </div>
        </div>

        <div className="space-y-4">
          <AIPanel title="Analyse complète">
            <p>{c.resumeIA}</p>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ai/30">
              <div><div className="text-xs text-muted-foreground">Service suggéré</div><div className="font-medium">{c.serviceSuggere}</div></div>
              <div><div className="text-xs text-muted-foreground">Priorité suggérée</div><div className="capitalize font-medium">{c.prioriteSuggere}</div></div>
              <div className="col-span-2"><div className="text-xs text-muted-foreground">Catégorie</div><div className="font-medium">Demande client</div></div>
            </div>
          </AIPanel>

          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold mb-3">Historique</div>
            <ol className="space-y-3 text-sm">
              {[
                { t: "Réceptionné par le BO", d: c.date },
                { t: "Analysé par l'IA", d: c.date },
                { t: "En attente d'affectation", d: c.date },
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary-bright" />
                  <div className="flex-1">
                    <div>{s.t}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
