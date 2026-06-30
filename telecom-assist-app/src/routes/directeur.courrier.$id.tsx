import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { courriersApi, servicesApi, type Courrier, type Service, type Recommendation } from "@/lib/api";
import { AIPanel } from "@/components/AIPanel";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { FileText, Clock, ArrowRight, CheckCircle2, Loader2, Brain, Sparkles } from "lucide-react";

export const Route = createFileRoute("/directeur/courrier/$id")({
  component: CourrierDetail,
});

const PRIORITES = ["HAUTE", "MOYENNE", "BASSE"] as const;

function statusToBadge(status: string): any {
  const map: Record<string, any> = {
    NOUVEAU: "nouveau",
    A_AFFECTER: "en_attente",
    A_TRAITER: "en_cours",
    EN_COURS: "en_cours",
    TRAITE: "traite",
    REJETE: "en_attente",
    EN_ATTENTE: "en_attente",
    CLOTURE: "traite",
  };
  return map[status] || "nouveau";
}

function CourrierDetail() {
  const { id } = Route.useParams();
  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Courrier["priorite"]>("MOYENNE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      courriersApi.getById(id),
      courriersApi.getRecommendations(id),
      servicesApi.getAll(),
    ])
      .then(([c, rec, svcs]) => {
        setCourrier(c);
        setRecommendation(rec);
        setServices(svcs);
        setSelectedService(rec.serviceId || c.service?._id || "");
        setSelectedPriority((c.priorite || rec.priorite || "MOYENNE"));
      })
      .catch(() => setMessage({ type: "error", text: "Impossible de charger le courrier." }))
      .finally(() => setLoading(false));

    // Check Ollama availability in background
    courriersApi.getOllamaStatus().then(s => setOllamaAvailable(s.available)).catch(() => setOllamaAvailable(false));
  }, [id]);

  async function reanalyserOllama() {
    setReanalyzing(true);
    setMessage(null);
    try {
      const rec = await courriersApi.reanalyserOllama(id);
      setRecommendation(rec);
      if (rec.serviceId) setSelectedService(rec.serviceId);
      setMessage({ type: "success", text: rec.source === "ollama" ? "Ré-analyse Ollama terminée." : "Ollama indisponible — résumé heuristique conservé." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Échec de la ré-analyse" });
    } finally {
      setReanalyzing(false);
    }
  }

  const selectedServiceObj = services.find(s => s._id === selectedService);

  async function handleAssign() {
    if (!selectedService) {
      setMessage({ type: "error", text: "Sélectionnez un service." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await courriersApi.assignService(id, selectedService, selectedAgent || undefined);
      await courriersApi.validateDirector(id, selectedPriority || undefined);
      setMessage({ type: "success", text: "Courrier affecté et validé." });
      const updated = await courriersApi.getById(id);
      setCourrier(updated);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur serveur" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (!courrier) return <div className="p-6 text-sm text-destructive">Courrier introuvable.</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{courrier.reference}</div>
          <h2 className="font-display text-2xl font-semibold">{courrier.objet}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>De : {courrier.correspondant || "-"}</span>•<span>{courrier.date ? new Date(courrier.date).toLocaleDateString() : "-"}</span>
            <StatusBadge status={statusToBadge(courrier.statut || "NOUVEAU")} />
            <PriorityBadge priority={(courrier.priorite || "MOYENNE").toLowerCase() as any} />
          </div>
        </div>
        <Link to="/directeur" className="rounded-md border px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
          <ArrowRight className="h-4 w-4 rotate-180" /> Retour
        </Link>
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-4">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b">
              <FileText className="h-4 w-4" /> Contenu extrait
            </div>
            <div className="p-4 text-sm text-foreground/90 whitespace-pre-wrap">
              {courrier.contenu || "Aucun contenu disponible."}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="text-sm font-semibold mb-3">Historique</div>
            <ol className="space-y-3 text-sm">
              {(courrier.historique || []).map((h: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary-bright" />
                  <div className="flex-1">
                    <div>{h.action}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(h.date).toLocaleString()}</div>
                  </div>
                </li>
              ))}
              {(courrier.historique || []).length === 0 && (
                <li className="text-muted-foreground text-xs">Aucune action enregistrée.</li>
              )}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <AIPanel title="Analyse complète">
            <div className="flex items-center gap-2 mb-2">
              {recommendation?.source === "ollama" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5">
                  <Brain className="h-3 w-3" /> Ollama
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5">
                  <Sparkles className="h-3 w-3" /> Heuristique
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed">{recommendation?.resume || "Résumé en cours de génération…"}</p>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ai/30">
              <div>
                <div className="text-xs text-muted-foreground">Service recommandé</div>
                <div className="font-medium">{recommendation?.serviceName || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Priorité suggérée</div>
                <div className="capitalize font-medium">{recommendation?.priorite?.toLowerCase() || "moyenne"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Courriers similaires traités</div>
                <div className="font-medium">{recommendation?.similarCount ?? 0}</div>
              </div>
            </div>

            {ollamaAvailable && (
              <button
                onClick={reanalyserOllama}
                disabled={reanalyzing}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md border border-ai/50 bg-ai/10 hover:bg-ai/20 text-amber-800 py-2 text-sm font-medium disabled:opacity-60"
              >
                {reanalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {reanalyzing ? "Ré-analyse Ollama en cours…" : "Ré-analyser avec Ollama"}
              </button>
            )}
          </AIPanel>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="text-sm font-semibold">Décision du directeur</div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Affecter au service</label>
              <select value={selectedService} onChange={e => { setSelectedService(e.target.value); setSelectedAgent(""); }} className="w-full rounded-md border bg-card px-3 py-2 text-sm">
                <option value="">Choisir un service…</option>
                {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            {selectedServiceObj && (selectedServiceObj.agents || []).length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Agent assigné (optionnel)</label>
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full rounded-md border bg-card px-3 py-2 text-sm">
                  <option value="">Aucun agent spécifique</option>
                  {(selectedServiceObj.agents || []).map(a => <option key={a._id} value={a._id}>{a.prenom} {a.nom}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium block mb-1.5">Priorité</label>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPriority(p)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition ${selectedPriority === p ? "border-primary-bright bg-primary-bright/10 text-primary-bright" : "hover:bg-accent"}`}
                  >{p.toLowerCase()}</button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAssign}
              disabled={saving}
              className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Validation…" : "Affecter et valider"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
