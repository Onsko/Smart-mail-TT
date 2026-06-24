import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/bo/courrier-sortant")({
  component: CourrierSortantPage,
});

function CourrierSortantPage() {
  const [draft, setDraft] = useState("");
  function generate() {
    setDraft(
`Tunisie Telecom — Direction Générale

Objet : Réponse à votre courrier

Madame, Monsieur,

Suite à votre correspondance, nous avons le plaisir de vous informer que votre dossier a été pris en charge par nos services. Une réponse définitive vous sera adressée dans un délai de 7 jours ouvrés.

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

La Direction
Tunisie Telecom`
    );
  }
  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
      <div className="rounded-xl bg-card border shadow-sm p-6">
        <h2 className="font-display text-xl font-semibold">Nouveau courrier sortant</h2>
        <p className="text-sm text-muted-foreground">Préparez et enregistrez un courrier au départ.</p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <Field label="N° d'ordre"><input className={inp} defaultValue="OUT-2026-0312" /></Field>
          <Field label="Date de départ"><input type="date" defaultValue="2026-06-22" className={inp} /></Field>
          <Field label="Destinataire" className="sm:col-span-2"><input className={inp} placeholder="Nom / Organisation" /></Field>
          <Field label="Objet" className="sm:col-span-2"><input className={inp} placeholder="Objet du courrier" /></Field>
          <Field label="Observations" className="sm:col-span-2">
            <textarea rows={3} className={inp + " resize-none"} placeholder="Notes internes…" />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-md border px-4 py-2 text-sm">Annuler</button>
          <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Enregistrer</button>
        </div>
      </div>

      <div className="rounded-xl border bg-ai-tint border-[color-mix(in_oklab,var(--color-ai)_40%,white)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-ai/30 text-amber-700 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Brouillon IA</div>
        </div>
        <button onClick={generate} className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium">
          Générer un brouillon de réponse
        </button>
        <textarea
          rows={14}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Le brouillon généré apparaîtra ici et restera modifiable."
          className="w-full rounded-md border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex justify-end gap-2">
          <button className="rounded-md border px-3 py-1.5 text-xs">Reformuler</button>
          <button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs">Utiliser</button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="text-sm font-medium block mb-1.5">{label}</label>{children}</div>;
}
