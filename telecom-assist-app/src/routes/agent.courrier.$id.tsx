import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { courriersApi, uploadDocument, type Courrier } from "@/lib/api";
import { AIPanel } from "@/components/AIPanel";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { FileText, Upload, Sparkles, RefreshCw, AlignLeft, Clock, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/agent/courrier/$id")({
  component: AgentCourrierDetail,
});

function AgentCourrierDetail() {
  const { id } = Route.useParams();
  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [savingStatut, setSavingStatut] = useState(false);
  const [savingReponse, setSavingReponse] = useState(false);
  const [iaLoading, setIaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    courriersApi.getById(id)
      .then((c) => {
        setCourrier(c);
        setReply(c.reponse || "");
      })
      .catch(() => setCourrier(null))
      .finally(() => setLoading(false));
  }, [id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleStatutChange(newStatut: string) {
    if (!courrier) return;
    setSavingStatut(true);
    try {
      const updated = await courriersApi.updateStatut(courrier._id, newStatut);
      setCourrier(updated);
      showToast(`Statut mis à jour : ${newStatut}`);
    } catch {
      showToast("Erreur lors de la mise à jour du statut");
    } finally {
      setSavingStatut(false);
    }
  }

  async function handleSaveReponse(envoyer: boolean) {
    if (!courrier) return;
    if (!reply.trim()) {
      showToast("Veuillez rédiger une réponse avant d'enregistrer.");
      return;
    }
    setSavingReponse(true);
    try {
      const updated = await courriersApi.saveReponse(courrier._id, reply, envoyer);
      setCourrier(updated);
      showToast(envoyer ? "Réponse envoyée — courrier marqué comme traité" : "Brouillon enregistré");
    } catch {
      showToast("Erreur lors de l'enregistrement de la réponse");
    } finally {
      setSavingReponse(false);
    }
  }

  async function gen(kind: "draft" | "rephrase" | "summary") {
    if (!courrier) return;
    setIaLoading(true);
    try {
      if (kind === "draft") {
        const { result } = await courriersApi.iaGenererReponse(courrier.objet, courrier.contenu || "");
        if (result) setReply(result);
        else showToast("Ollama indisponible — réponse par défaut utilisée");
      } else if (kind === "rephrase") {
        const text = reply.trim() || courrier.contenu || "";
        if (!text) { showToast("Aucun texte à reformuler."); return; }
        const { result } = await courriersApi.iaReformuler(text);
        if (result) setReply(result);
        else showToast("Ollama indisponible");
      } else if (kind === "summary") {
        const text = reply.trim() || courrier.contenu || courrier.resumeIA || "";
        if (!text) { showToast("Aucun texte à résumer."); return; }
        const { result } = await courriersApi.iaResumer(text);
        if (result) setReply(prev => `Résumé : ${result}${prev ? "\n\n---\n\n" + prev : ""}`);
        else showToast("Ollama indisponible");
      }
    } catch {
      showToast("Erreur lors de l'appel à l'IA");
    } finally {
      setIaLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !courrier) return;
    setUploading(true);
    try {
      const { url } = await uploadDocument(file);
      const updated = await courriersApi.attachDocument(courrier._id, url);
      setCourrier(updated);
      showToast("Fichier joint avec succès");
    } catch {
      showToast("Erreur lors de l'upload du fichier");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (!courrier) return <div className="p-6 text-sm text-destructive">Courrier introuvable.</div>;

  const docs = courrier.documents || [];
  const hasDoc = docs.length > 0;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-card border shadow-lg px-4 py-3 text-sm font-medium animate-in slide-in-from-bottom-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" /> {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{courrier.reference}</div>
          <h2 className="font-display text-2xl font-semibold">{courrier.objet}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{courrier.correspondant || "—"}</span>
            <span>•</span>
            <span>{new Date(courrier.createdAt).toLocaleDateString("fr-FR")}</span>
            {courrier.priorite && <PriorityBadge priority={courrier.priorite.toLowerCase() as any} />}
            {courrier.statut && <StatusBadge status={courrier.statut.toLowerCase() as any} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savingStatut && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <select
            value={courrier.statut || ""}
            onChange={e => handleStatutChange(e.target.value)}
            disabled={savingStatut}
            className="rounded-md border bg-card px-3 py-2 text-sm disabled:opacity-60"
          >
            <option value="EN_COURS">En cours</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="TRAITE">Traité</option>
            <option value="CLOTURE">Clôturé</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b">
              <FileText className="h-4 w-4" /> Document{docs.length > 1 ? `s (${docs.length})` : ""}
            </div>
            {hasDoc ? (
              <div className="space-y-2 p-3">
                {docs.map((url, i) => {
                  const filename = url.split("/").pop() || `document-${i + 1}`;
                  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff)$/i.test(url);
                  return (
                    <div key={i} className="rounded-lg border overflow-hidden">
                      {isImage ? (
                        <img src={url} alt={filename} className="w-full max-h-[400px] object-contain bg-muted/30" />
                      ) : (
                        <div className="aspect-[16/8] bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_10px,#eef2f7_10px,#eef2f7_20px)] flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                          <FileText className="h-10 w-10" />
                          <span>{filename}</span>
                          <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">Ouvrir le document</a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="aspect-[16/8] bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_10px,#eef2f7_10px,#eef2f7_20px)] flex items-center justify-center text-muted-foreground text-sm">
                Aucun document joint
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Rédaction de la réponse</h3>
              <div className="flex flex-wrap gap-1.5">
                <IABtn onClick={() => gen("draft")}    icon={iaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} disabled={iaLoading}>Générer une réponse</IABtn>
                <IABtn onClick={() => gen("rephrase")} icon={iaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} disabled={iaLoading}>Reformuler</IABtn>
                <IABtn onClick={() => gen("summary")}  icon={iaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlignLeft className="h-3.5 w-3.5" />} disabled={iaLoading}>Résumer</IABtn>
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
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
              {uploading ? "Upload en cours…" : "Joindre un fichier"}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => handleSaveReponse(false)}
                disabled={savingReponse}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
              >
                {savingReponse ? "Enregistrement…" : "Enregistrer brouillon"}
              </button>
              <button
                onClick={() => handleSaveReponse(true)}
                disabled={savingReponse}
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {savingReponse ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {courrier.resumeIA && (
            <AIPanel title="Résumé IA"><p>{courrier.resumeIA}</p></AIPanel>
          )}
          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold mb-3">Historique</div>
            <ol className="space-y-3 text-sm">
              {(courrier.historique || []).map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary-bright" />
                  <div className="flex-1">
                    <div>{h.action}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(h.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </li>
              ))}
              {(!courrier.historique || courrier.historique.length === 0) && (
                <li className="text-muted-foreground text-xs">Aucun historique disponible.</li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function IABtn({ children, icon, onClick, disabled }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1 rounded-md bg-ai/20 hover:bg-ai/30 text-amber-800 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">
      {icon}{children}
    </button>
  );
}
