import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Download, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { courriersApi, type TrackedCourrier } from "@/lib/api";

export const Route = createFileRoute("/client/suivi")({
  component: SuiviPage,
});

const STATUT_LABEL: Record<string, string> = {
  NOUVEAU: "Réceptionné par le Bureau d'Ordre",
  A_AFFECTER: "En attente d'affectation",
  A_TRAITER: "Affecté au service",
  EN_COURS: "En cours de traitement",
  TRAITE: "Traité",
  CLOTURE: "Clôturé",
};

function SuiviPage() {
  const [ref, setRef] = useState("");
  const [result, setResult] = useState<TrackedCourrier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await courriersApi.trackByReference(ref.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Courrier introuvable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Suivi de votre courrier</h2>
        <p className="text-sm text-muted-foreground">Entrez la référence reçue lors du dépôt.</p>
      </div>

      <form onSubmit={handleSearch} className="rounded-2xl bg-card border shadow-sm p-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={ref}
            onChange={e => setRef(e.target.value)}
            placeholder="Ex : TT-2026-0420"
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button disabled={loading} className="rounded-md bg-primary text-primary-foreground px-5 text-sm font-semibold disabled:opacity-60">
          {loading ? "Recherche…" : "Rechercher"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl bg-card border shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-mono text-muted-foreground">{result.reference}</div>
              <div className="font-semibold mt-1">{result.objet}</div>
              {result.service && (
                <div className="text-xs text-muted-foreground mt-0.5">Service : {result.service.name}</div>
              )}
            </div>
            <StatusBadge status={result.statut.toLowerCase() as any} />
          </div>

          <ol className="space-y-4">
            {result.historique.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-white shrink-0 bg-success">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{h.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </li>
            ))}
            {result.statut === "TRAITE" || result.statut === "CLOTURE" ? (
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-white shrink-0 bg-success">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Réponse envoyée</div>
                </div>
              </li>
            ) : (
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground shrink-0 bg-muted">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground">Réponse en attente</div>
                </div>
              </li>
            )}
          </ol>

          {(result.statut === "TRAITE" || result.statut === "CLOTURE") && (
            <>
              {result.reponseEnvoyee && result.reponse && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="text-sm font-semibold">Réponse</div>
                  <p className="text-sm whitespace-pre-wrap">{result.reponse}</p>
                </div>
              )}
              <button
                onClick={() => {
                  const win = window.open("", "_blank");
                  if (!win) return;
                  win.document.write(`
                    <html><head><title>Réponse - ${result.reference}</title>
                    <style>
                      body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
                      h1 { font-size: 18px; color: #1e40af; }
                      .ref { font-size: 12px; color: #666; font-family: monospace; }
                      .meta { font-size: 13px; color: #555; margin: 10px 0; }
                      .reponse { white-space: pre-wrap; font-size: 14px; line-height: 1.6; margin-top: 20px; }
                      .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                    </style></head><body>
                      <div class="ref">${result.reference}</div>
                      <h1>${result.objet}</h1>
                      <div class="meta">
                        Expéditeur : ${result.correspondant || "—"}<br/>
                        Service : ${result.service?.name || "—"}<br/>
                        Date : ${new Date(result.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                      <div class="reponse">${(result.reponse || "Aucune réponse disponible.").replace(/</g, "&lt;")}</div>
                      <div class="footer">Tunisie Telecom — Document généré le ${new Date().toLocaleString("fr-FR")}</div>
                    </body></html>
                  `);
                  win.document.close();
                  win.focus();
                  setTimeout(() => win.print(), 500);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Télécharger la réponse (PDF)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
