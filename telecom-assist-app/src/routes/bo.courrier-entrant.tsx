import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { AIPanel } from "@/components/AIPanel";
import { PriorityBadge } from "@/components/StatusBadge";
import {
  courriersApi,
  uploadDocument,
  type CreateCourrierPayload,
  type ExtractedFields,
} from "@/lib/api";

export const Route = createFileRoute("/bo/courrier-entrant")({
  component: CourrierEntrantPage,
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

function today() {
  return new Date().toISOString().split("T")[0];
}

function CourrierEntrantPage() {
  const [form, setForm] = useState<CreateCourrierPayload>({
    type: "ENTRANT",
    date: today(),
    nombrePieces: 1,
    correspondant: "",
    objet: "",
    contenu: "",
    observation: "",
    categorie: "AUTRE",
    domaine: "AUTRE",
    priorite: "MOYENNE",
    documents: [],
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
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
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Échec de l'upload" });
    } finally {
      setUploading(false);
    }
  }

  async function analyze() {
    if (!file || !form.documents?.[0]) {
      setMessage({ type: "error", text: "Téléversez d'abord un document." });
      return;
    }
    setExtracting(true);
    setMessage(null);
    try {
      const extraction = await courriersApi.extractStandalone(form.documents[0], file.type);
      setExtracted(extraction);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Échec de l'analyse" });
    } finally {
      setExtracting(false);
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
    setMessage({ type: "success", text: "Suggestions appliquées." });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await courriersApi.create(form);
      setMessage({ type: "success", text: "Courrier enregistré avec succès." });
      setForm({
        type: "ENTRANT",
        date: today(),
        nombrePieces: 1,
        correspondant: "",
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
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur serveur" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      <form onSubmit={submit} className="space-y-6">
        <div className="rounded-xl bg-card border shadow-sm p-6">
          <h2 className="font-display text-xl font-semibold">Nouveau courrier entrant</h2>
          <p className="text-sm text-muted-foreground">Saisissez les informations ou laissez l'IA les extraire du scan.</p>

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
            <Field label="Date de réception">
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inp} />
            </Field>
            <Field label="Nombre de pièces">
              <input
                type="number"
                min={1}
                value={form.nombrePieces}
                onChange={(e) => update("nombrePieces", Number(e.target.value))}
                className={inp}
              />
            </Field>
            <Field label="Expéditeur" className="sm:col-span-2">
              <input value={form.correspondant} onChange={(e) => update("correspondant", e.target.value)} className={inp} placeholder="Nom de l'expéditeur" />
            </Field>
            <Field label="Objet" className="sm:col-span-2">
              <input value={form.objet} onChange={(e) => update("objet", e.target.value)} className={inp} placeholder="Objet du courrier" />
            </Field>
            <Field label="Contenu" className="sm:col-span-2">
              <textarea
                rows={5}
                value={form.contenu}
                onChange={(e) => update("contenu", e.target.value)}
                className={inp + " resize-none"}
                placeholder="Contenu du courrier…"
              />
            </Field>
            <Field label="Observation" className="sm:col-span-2">
              <textarea
                rows={3}
                value={form.observation}
                onChange={(e) => update("observation", e.target.value)}
                className={inp + " resize-none"}
                placeholder="Observation éventuelle…"
              />
            </Field>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium block mb-1.5">Document scanné</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 cursor-pointer hover:bg-accent/40 transition">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">Glissez un PDF/Image ou <span className="text-primary-bright font-medium">parcourez</span></span>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
            </label>
            {uploading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Téléversement…
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
            <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => { setFile(null); setExtracted(null); }}>
              Annuler
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60">
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4 lg:sticky lg:top-24">
        {extracted ? (
          <AIPanel title="Analyse du document">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Expéditeur détecté</div>
                <div className="font-medium">{extracted.correspondant}</div>
              </div>
              {(extracted.date || extracted.lieu) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Date détectée</div>
                    <div className="font-medium">{extracted.date || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Lieu détecté</div>
                    <div className="font-medium">{extracted.lieu || "—"}</div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">Objet détecté</div>
                <div className="font-medium">{extracted.objet}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Contenu extrait</div>
                <p className="text-sm">{extracted.contenu}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ai/30">
              <div>
                <div className="text-xs text-muted-foreground">Catégorie</div>
                <div className="font-medium">{extracted.categorie}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Domaine</div>
                <div className="font-medium">{extracted.domaine}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Priorité suggérée</div>
                <PriorityBadge priority={extracted.priorite.toLowerCase() as "haute" | "moyenne" | "basse"} />
              </div>
            </div>
            <button
              onClick={applyExtraction}
              className="mt-2 w-full rounded-md bg-ai/30 hover:bg-ai/40 text-amber-800 text-sm font-medium py-2"
            >
              Appliquer les suggestions
            </button>
          </AIPanel>
        ) : (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="text-sm text-muted-foreground">Téléversez un document puis lancez l'analyse IA.</div>
            <button
              onClick={analyze}
              disabled={!file || uploading || extracting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {extracting ? "Analyse en cours…" : "Analyser avec l'IA"}
            </button>
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

