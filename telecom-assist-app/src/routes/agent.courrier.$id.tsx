import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { COURRIERS } from "@/lib/mockData";
import { AIPanel } from "@/components/AIPanel";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { FileText, Upload, Sparkles, RefreshCw, AlignLeft, Clock } from "lucide-react";

export const Route = createFileRoute("/agent/courrier/$id")({
  component: AgentCourrierDetail,
});

function AgentCourrierDetail() {
  const { id } = Route.useParams();
  const c = COURRIERS.find(x => x.id === id) ?? COURRIERS[0];
  const [reply, setReply] = useState("");
  const [statut, setStatut] = useState(c.statut);

  function gen(kind: "draft" | "rephrase" | "summary") {
    if (kind === "draft") setReply("Madame, Monsieur,\n\nNous avons bien reçu votre courrier et vous confirmons sa prise en charge. Un technicien interviendra dans un délai de 72h.\n\nCordialement,\nService Technique — Tunisie Telecom");
    if (kind === "rephrase") setReply(prev => prev ? prev + "\n\n(Version reformulée par l'IA)" : "Aucun texte à reformuler.");
    if (kind === "summary") setReply(prev => "Résumé : " + (prev || c.resumeIA));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{c.ref}</div>
          <h2 className="font-display text-2xl font-semibold">{c.objet}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{c.expediteur}</span>•<span>{c.date}</span>
            <PriorityBadge priority={c.priorite} />
            <StatusBadge status={statut} />
          </div>
        </div>
        <select value={statut} onChange={e => setStatut(e.target.value as any)} className="rounded-md border bg-card px-3 py-2 text-sm">
          <option value="en_cours">En cours</option>
          <option value="en_attente">En attente</option>
          <option value="traite">Traité</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b">
              <FileText className="h-4 w-4" /> Document
            </div>
            <div className="aspect-[16/8] bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_10px,#eef2f7_10px,#eef2f7_20px)] flex items-center justify-center text-muted-foreground text-sm">
              Aperçu PDF / Image
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Rédaction de la réponse</h3>
              <div className="flex flex-wrap gap-1.5">
                <IABtn onClick={() => gen("draft")}    icon={<Sparkles className="h-3.5 w-3.5" />}>Générer une réponse</IABtn>
                <IABtn onClick={() => gen("rephrase")} icon={<RefreshCw className="h-3.5 w-3.5" />}>Reformuler</IABtn>
                <IABtn onClick={() => gen("summary")}  icon={<AlignLeft className="h-3.5 w-3.5" />}>Résumer</IABtn>
              </div>
            </div>
            <textarea
              rows={10}
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Rédigez votre réponse ici…"
              className="w-full rounded-md border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="flex items-center gap-2 rounded-md border-2 border-dashed px-4 py-3 cursor-pointer hover:bg-accent/40 text-sm">
              <Upload className="h-4 w-4 text-muted-foreground" /> Joindre un fichier
              <input type="file" className="hidden" />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button className="rounded-md border px-4 py-2 text-sm">Enregistrer brouillon</button>
              <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Envoyer</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AIPanel title="Résumé IA"><p>{c.resumeIA}</p></AIPanel>
          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold mb-3">Historique</div>
            <ol className="space-y-3 text-sm">
              {["Réceptionné par le BO","Affecté au service Technique","Assigné à l'agent","En cours de traitement"].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary-bright" />
                  <div className="flex-1">
                    <div>{t}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{c.date}</div>
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

function IABtn({ children, icon, onClick }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 rounded-md bg-ai/20 hover:bg-ai/30 text-amber-800 px-2.5 py-1.5 text-xs font-medium">
      {icon}{children}
    </button>
  );
}
