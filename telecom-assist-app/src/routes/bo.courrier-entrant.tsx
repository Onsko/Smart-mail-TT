import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { AIPanel } from "@/components/AIPanel";
import { genRef } from "@/lib/mockData";
import { PriorityBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/bo/courrier-entrant")({
  component: CourrierEntrantPage,
});

function CourrierEntrantPage() {
  const [ref] = useState(genRef);
  const [file, setFile] = useState<File | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      <div className="space-y-6">
        <div className="rounded-xl bg-card border shadow-sm p-6">
          <h2 className="font-display text-xl font-semibold">Nouveau courrier entrant</h2>
          <p className="text-sm text-muted-foreground">Saisissez les informations du courrier reçu.</p>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Field label="Référence"><input value={ref} readOnly className="w-full rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono" /></Field>
            <Field label="Date de réception"><input type="date" defaultValue="2026-06-22" className={inp} /></Field>
            <Field label="Expéditeur"><input className={inp} placeholder="Nom de l'expéditeur" /></Field>
            <Field label="Type">
              <select className={inp}>
                <option>Client</option><option>Fournisseur</option><option>Partenaire</option><option>STEG</option><option>Organisation</option>
              </select>
            </Field>
            <Field label="Objet" className="sm:col-span-2"><input className={inp} placeholder="Objet du courrier" /></Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea rows={4} className={inp + " resize-none"} placeholder="Description détaillée…" />
            </Field>
            <Field label="N° d'archive"><input className={inp} placeholder="ARCH-…" /></Field>
            <Field label="Observations"><input className={inp} placeholder="Optionnel" /></Field>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium block mb-1.5">Document</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 cursor-pointer hover:bg-accent/40 transition">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">Glissez votre PDF/Image ou <span className="text-primary-bright font-medium">parcourez</span></span>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setAnalyzed(true); }} />
            </label>
            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-md border bg-accent/30 p-3 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium truncate flex-1">{file.name}</span>
                <span className="text-muted-foreground text-xs">{Math.round(file.size/1024)} Ko</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button className="rounded-md border px-4 py-2 text-sm">Annuler</button>
            <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Enregistrer</button>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24">
        {analyzed ? (
          <AIPanel title="Analyse du document">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Résumé automatique</div>
              <p>Demande de raccordement FTTH pour un local commercial situé Avenue Bourguiba, Tunis. Délai souhaité : 15 jours.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ai/30">
              <div>
                <div className="text-xs text-muted-foreground">Catégorie</div>
                <div className="font-medium">Demande</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Service suggéré</div>
                <div className="font-medium">Technique</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Priorité suggérée</div>
                <PriorityBadge priority="moyenne" />
              </div>
            </div>
            <button className="mt-2 w-full rounded-md bg-ai/30 hover:bg-ai/40 text-amber-800 text-sm font-medium py-2">
              Appliquer les suggestions
            </button>
          </AIPanel>
        ) : (
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            Téléversez un document pour déclencher l'analyse IA.
          </div>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
