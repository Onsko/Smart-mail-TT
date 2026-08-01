import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileText, Sparkles, Loader2, Brain, Mail } from "lucide-react";
import { AIPanel } from "@/components/AIPanel";
import { PriorityBadge } from "@/components/StatusBadge";
import {
  courriersApi,
  uploadDocument,
  type CreateCourrierPayload,
  type ExtractedFields,
  type OllamaExtraction,
} from "@/lib/api";

export const Route = createFileRoute("/bo/courrier-entrant")({
  component: CourrierEntrantPage,
});

function today() {
  return new Date().toISOString().split("T")[0];
}

function CourrierEntrantPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateCourrierPayload>({
    type: "ENTRANT",
    date: today(),
    nombrePieces: 1,
    correspondant: "",
    emailClient: "",
    objet: "",
    contenu: "",
    observation: "",
    categorie: "AUTRE",
    domaine: "AUTRE",
    priorite: "MOYENNE",
    documents: [],
  });

  const CATEGORIES = [
    { value: "RECLAMATION", label: "Réclamation" },
    { value: "DEMANDE", label: "Demande" },
    { value: "FACTURE", label: "Facture" },
    { value: "INFORMATION", label: "Information" },
    { value: "AUTRE", label: "Autre" },
  ];

  const DOMAINES = [
    { value: "TECHNIQUE", label: "Technique" },
    { value: "RH", label: "Ressources humaines" },
    { value: "FINANCE", label: "Finance" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "AUTRE", label: "Autre" },
  ];

  const PRIORITES = [
    { value: "HAUTE", label: "Haute" },
    { value: "MOYENNE", label: "Moyenne" },
    { value: "BASSE", label: "Basse" },
  ];

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [ollamaResult, setOllamaResult] = useState<OllamaExtraction | null>(null);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function update<K extends keyof CreateCourrierPayload>(field: K, value: CreateCourrierPayload[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setExtracted(null);
    if (!selected) return;

    setUploading(true);
    setMessage(null);
    try {
      const uploaded = await uploadDocument(selected);
      update("documents", [uploaded.url]);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t("bo.incoming.uploadError") });
    } finally {
      setUploading(false);
    }
  }

  async function analyze() {
    if (!file || !form.documents?.[0]) {
      setMessage({ type: "error", text: t("bo.incoming.uploadFirst") });
      return;
    }
    setExtracting(true);
    setMessage(null);
    try {
      const extraction = await courriersApi.extractStandalone(form.documents[0], file.type);
      setExtracted(extraction);
      setOllamaResult(null);
      // Check Ollama availability in the background (non-blocking).
      courriersApi.getOllamaStatus().then(s => setOllamaAvailable(s.available)).catch(() => setOllamaAvailable(false));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t("bo.incoming.analysisError") });
    } finally {
      setExtracting(false);
    }
  }

  async function analyzeWithOllama() {
    if (!file || !form.documents?.[0]) {
      setMessage({ type: "error", text: t("bo.incoming.uploadFirst") });
      return;
    }
    setOllamaLoading(true);
    setMessage(null);
    try {
      const result = await courriersApi.analyzeWithOllama(form.documents[0], file.type);
      setOllamaResult(result);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t("bo.incoming.ollamaNotDetected") });
    } finally {
      setOllamaLoading(false);
    }
  }

  function applyExtraction() {
    if (!extracted) return;
    setForm((f) => ({
      ...f,
      correspondant: extracted.correspondant || f.correspondant,
      objet: extracted.objet || f.objet,
      contenu: extracted.contenu || f.contenu,
      categorie: extracted.categorie || f.categorie,
      domaine: extracted.domaine || f.domaine,
      priorite: extracted.priorite || f.priorite,
      date: extracted.date || f.date,
    }));
    setMessage({ type: "success", text: t("bo.incoming.suggestionsApplied") });
  }

  function applyOllamaResult() {
    if (!ollamaResult) return;
    setForm((f) => ({
      ...f,
      correspondant: ollamaResult.correspondant || f.correspondant,
      objet: ollamaResult.objet || f.objet,
      contenu: ollamaResult.contenu || f.contenu,
      categorie: ollamaResult.categorie || f.categorie,
      domaine: ollamaResult.domaine || f.domaine,
      priorite: ollamaResult.priorite || f.priorite,
      date: ollamaResult.date || f.date,
    }));
    setMessage({ type: "success", text: `${t("bo.incoming.ollamaApplied")} ${ollamaResult.serviceName || ""}`.trim() });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const created = await courriersApi.create(form);
      const msg = created.reference
        ? `Courrier ${created.reference} créé${form.emailClient ? ' — notification envoyée par email' : ''}`
        : t("bo.incoming.success");
      setMessage({ type: "success", text: msg });
      setForm({
        type: "ENTRANT",
        date: today(),
        nombrePieces: 1,
        correspondant: "",
        emailClient: "",
        objet: "",
        contenu: "",
        observation: "",
        categorie: "AUTRE",
        domaine: "AUTRE",
        priorite: "MOYENNE",
        documents: [],
      });
      setFile(null);
      setExtracted(null);
      setOllamaResult(null);
      setOllamaAvailable(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t("bo.incoming.serverError") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      <form onSubmit={submit} className="space-y-6">
        <div className="rounded-xl bg-card border shadow-sm p-6">
          <h2 className="font-display text-xl font-semibold">{t("bo.incoming.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("bo.incoming.desc")}</p>

          {message && (
            <div
              className={`mt-4 rounded-md border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Field label={t("bo.incoming.dateReception")}>
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inp} />
            </Field>
            <Field label={t("bo.incoming.nbPieces")}>
              <input
                type="number"
                min={1}
                value={form.nombrePieces}
                onChange={(e) => update("nombrePieces", Number(e.target.value))}
                className={inp}
              />
            </Field>
            <Field label={t("bo.incoming.expediteur")} className="sm:col-span-2">
              <input value={form.correspondant} onChange={(e) => update("correspondant", e.target.value)} className={inp} placeholder={t("bo.incoming.expediteurPlaceholder")} />
            </Field>
            <Field label="Email du client (pour notification)" className="sm:col-span-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={form.emailClient} onChange={(e) => update("emailClient", e.target.value)} className={inp + " pl-9"} placeholder="client@exemple.com" type="email" />
              </div>
            </Field>
            <Field label={t("bo.incoming.objet")} className="sm:col-span-2">
              <input value={form.objet} onChange={(e) => update("objet", e.target.value)} className={inp} placeholder={t("bo.incoming.objetPlaceholder")} />
            </Field>
            <Field label={t("bo.incoming.contenu")} className="sm:col-span-2">
              <textarea
                rows={5}
                value={form.contenu}
                onChange={(e) => update("contenu", e.target.value)}
                className={inp + " resize-none"}
                placeholder={t("bo.incoming.contenuPlaceholder")}
              />
            </Field>
            <Field label={t("bo.incoming.observation")} className="sm:col-span-2">
              <textarea
                rows={3}
                value={form.observation}
                onChange={(e) => update("observation", e.target.value)}
                className={inp + " resize-none"}
                placeholder={t("bo.incoming.observationPlaceholder")}
              />
            </Field>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium block mb-1.5">{t("bo.incoming.scannedDoc")}</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 cursor-pointer hover:bg-accent/40 transition">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">{t("bo.incoming.uploadHint")} <span className="text-primary-bright font-medium">{t("bo.incoming.uploadBrowse")}</span></span>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
            </label>
            {uploading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("bo.incoming.uploading")}
              </div>
            )}
            {file && !uploading && (
              <div className="mt-3 flex items-center gap-3 rounded-md border bg-accent/30 p-3 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium truncate flex-1">{file.name}</span>
                <span className="text-muted-foreground text-xs">{Math.round(file.size / 1024)} Ko</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => { setFile(null); setExtracted(null); setOllamaResult(null); setOllamaAvailable(null); }}>
              {t("bo.incoming.cancel")}
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60">
              {loading ? t("bo.incoming.saving") : t("bo.incoming.save")}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4 lg:sticky lg:top-24">
        {/* Heuristic panel */}
        {extracted && (
          <AIPanel title={t("bo.incoming.heuristicTitle")}>
            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {t("bo.incoming.heuristicSubtitle")}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicField")}</div>
                <div className="font-medium text-sm">{extracted.correspondant}</div>
              </div>
              {(extracted.date || extracted.lieu) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicDate")}</div>
                    <div className="font-medium text-sm">{extracted.date || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicLieu")}</div>
                    <div className="font-medium text-sm">{extracted.lieu || "—"}</div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicObjet")}</div>
                <div className="font-medium text-sm">{extracted.objet}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t("bo.incoming.heuristicContenu")}</div>
                <p className="text-sm line-clamp-4">{extracted.contenu}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ai/30">
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicCategorie")}</div>
                <div className="font-medium text-sm">{extracted.categorie}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicDomaine")}</div>
                <div className="font-medium text-sm">{extracted.domaine}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">{t("bo.incoming.heuristicPriorite")}</div>
                <PriorityBadge priority={extracted.priorite.toLowerCase() as "haute" | "moyenne" | "basse"} />
              </div>
            </div>
            <button
              onClick={applyExtraction}
              className="mt-3 w-full rounded-md bg-ai/30 hover:bg-ai/40 text-amber-800 text-sm font-medium py-2"
            >
              {t("bo.incoming.heuristicApply")}
            </button>
          </AIPanel>
        )}

        {/* Ollama panel */}
        {ollamaResult && (
          <AIPanel title={t("bo.incoming.ollamaTitle")}>
            <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-800">
              <Brain className="h-3.5 w-3.5" />
              {ollamaResult.source === "ollama" ? `${t("bo.incoming.ollamaGenerated")} ${ollamaResult.source}` : t("bo.incoming.ollamaFallback")}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicField")}</div>
                <div className="font-medium text-sm">{ollamaResult.correspondant}</div>
              </div>
              {(ollamaResult.date || ollamaResult.lieu) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicDate")}</div>
                    <div className="font-medium text-sm">{ollamaResult.date || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicLieu")}</div>
                    <div className="font-medium text-sm">{ollamaResult.lieu || "—"}</div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicObjet")}</div>
                <div className="font-medium text-sm">{ollamaResult.objet}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t("bo.incoming.heuristicContenu")}</div>
                <p className="text-sm line-clamp-4">{ollamaResult.contenu}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ai/30">
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicCategorie")}</div>
                <div className="font-medium text-sm">{ollamaResult.categorie}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("bo.incoming.heuristicDomaine")}</div>
                <div className="font-medium text-sm">{ollamaResult.domaine}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">{t("bo.incoming.heuristicPriorite")}</div>
                <PriorityBadge priority={ollamaResult.priorite.toLowerCase() as "haute" | "moyenne" | "basse"} />
              </div>
            </div>

            {ollamaResult.resume && (
              <div className="mt-3 rounded-md border border-ai/40 bg-ai/10 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                  <Brain className="h-3.5 w-3.5" />
                  {t("bo.incoming.ollamaSummary")}
                </div>
                <p className="text-sm text-amber-900">{ollamaResult.resume}</p>
              </div>
            )}

            {ollamaResult.serviceName && (
              <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2.5">
                <div className="text-xs text-blue-700">{t("bo.incoming.ollamaService")}</div>
                <div className="font-semibold text-sm text-blue-900">{ollamaResult.serviceName}</div>
              </div>
            )}

            <button
              onClick={applyOllamaResult}
              className="mt-3 w-full rounded-md bg-ai/40 hover:bg-ai/50 text-amber-900 text-sm font-medium py-2"
            >
              {t("bo.incoming.ollamaApply")}
            </button>
          </AIPanel>
        )}

        {/* Action buttons when no results yet */}
        {!extracted && !ollamaResult && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="text-sm text-muted-foreground">{t("bo.incoming.ollamaNoDoc")}</div>
            <button
              onClick={analyze}
              disabled={!file || uploading || extracting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {extracting ? t("bo.incoming.ollamaAnalyzing") : t("bo.incoming.ollamaAnalyze")}
            </button>
            {ollamaAvailable && (
              <button
                onClick={analyzeWithOllama}
                disabled={!file || uploading || ollamaLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-ai/50 bg-ai/10 hover:bg-ai/20 text-amber-800 py-2 text-sm font-medium disabled:opacity-60"
              >
                {ollamaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {ollamaLoading ? t("bo.incoming.ollamaAnalyzingOllama") : t("bo.incoming.ollamaAnalyzeOllama")}
              </button>
            )}
          </div>
        )}

        {/* Ollama trigger button when heuristic is shown but Ollama not yet run */}
        {extracted && !ollamaResult && (
          <>
            {ollamaAvailable === null ? null : ollamaAvailable ? (
              <button
                onClick={analyzeWithOllama}
                disabled={ollamaLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-ai/50 bg-ai/10 hover:bg-ai/20 text-amber-800 py-2 text-sm font-medium disabled:opacity-60"
              >
                {ollamaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {ollamaLoading ? t("bo.incoming.ollamaAnalyzingOllama") : t("bo.incoming.ollamaAnalyzeBetter")}
              </button>
            ) : (
              <div className="text-xs text-muted-foreground text-center">
                {t("bo.incoming.ollamaNotDetected")}
              </div>
            )}
          </>
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

