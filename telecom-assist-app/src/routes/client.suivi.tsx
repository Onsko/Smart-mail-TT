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
                onClick={async () => {
                  try {
                    // Simple approach: Use jsPDF directly without html2canvas
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF();
                    
                    // Set up the document
                    const margin = 20;
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const maxWidth = pageWidth - (2 * margin);
                    let y = margin;
                    
                    // Helper function to add text with line breaks
                    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
                      doc.setFontSize(fontSize);
                      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                      doc.setTextColor(color);
                      
                      const lines = doc.splitTextToSize(text, maxWidth);
                      doc.text(lines, margin, y);
                      y += (lines.length * fontSize * 0.35) + 5;
                    };
                    
                    // Add content
                    addText(result.reference, 10, false, '#666666');
                    y += 5;
                    
                    addText(result.objet, 16, true, '#1e40af');
                    y += 10;
                    
                    addText(`Expéditeur : ${result.correspondant || "—"}`, 11);
                    addText(`Service : ${result.service?.name || "—"}`, 11);
                    addText(`Date : ${new Date(result.createdAt).toLocaleDateString("fr-FR")}`, 11);
                    y += 10;
                    
                    // Add response content
                    const reponseText = result.reponse || "Aucune réponse disponible.";
                    addText(reponseText, 12);
                    
                    // Add footer
                    y += 20;
                    doc.setDrawColor('#cccccc');
                    doc.line(margin, y, pageWidth - margin, y);
                    y += 10;
                    
                    addText(`Tunisie Telecom — Document généré le ${new Date().toLocaleString("fr-FR")}`, 9, false, '#999999');
                    
                    // Save the PDF
                    doc.save(`reponse-${result.reference}.pdf`);
                    
                  } catch (error) {
                    console.error('Erreur lors de la génération du PDF:', error);
                    
                    // Fallback: Try the iframe approach
                    try {
                      const html2pdf = (await import('html2pdf.js')).default;
                      
                      // Create a completely isolated iframe for PDF generation
                      const iframe = document.createElement('iframe');
                      iframe.style.position = 'absolute';
                      iframe.style.left = '-9999px';
                      iframe.style.top = '0';
                      iframe.style.width = '800px';
                      iframe.style.height = '600px';
                      iframe.style.border = 'none';
                      
                      document.body.appendChild(iframe);
                      
                      // Write clean HTML to iframe
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (!iframeDoc) throw new Error('Cannot access iframe document');
                      
                      iframeDoc.open();
                      iframeDoc.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="utf-8">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: Arial, sans-serif; background: #ffffff; color: #333; }
                            .container { max-width: 700px; margin: 0; padding: 20px; }
                            .reference { font-size: 12px; color: #666; font-family: monospace; margin-bottom: 15px; }
                            .title { font-size: 18px; color: #1e40af; margin-bottom: 15px; font-weight: bold; }
                            .meta { font-size: 13px; color: #555; margin-bottom: 20px; line-height: 1.4; }
                            .content { font-size: 14px; line-height: 1.6; margin: 20px 0; white-space: pre-wrap; }
                            .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ccc; padding-top: 10px; }
                            strong { font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <div class="reference">${result.reference}</div>
                            <h1 class="title">${result.objet}</h1>
                            <div class="meta">
                              <strong>Expéditeur :</strong> ${result.correspondant || "—"}<br/>
                              <strong>Service :</strong> ${result.service?.name || "—"}<br/>
                              <strong>Date :</strong> ${new Date(result.createdAt).toLocaleDateString("fr-FR")}
                            </div>
                            <div class="content">${(result.reponse || "Aucune réponse disponible.").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                            <div class="footer">
                              <strong>Tunisie Telecom</strong> — Document généré le ${new Date().toLocaleString("fr-FR")}
                            </div>
                          </div>
                        </body>
                        </html>
                      `);
                      iframeDoc.close();
                      
                      // Wait for iframe to load
                      await new Promise((resolve) => {
                        iframe.onload = resolve;
                        setTimeout(resolve, 100); // Fallback
                      });
                      
                      // Configure html2pdf with iframe-specific settings
                      const options = {
                        margin: [15, 15, 15, 15],
                        filename: `reponse-${result.reference}.pdf`,
                        image: { 
                          type: 'jpeg', 
                          quality: 0.95 
                        },
                        html2canvas: { 
                          scale: 2,
                          useCORS: false,
                          allowTaint: true,
                          backgroundColor: '#ffffff',
                          ignoreElements: (element: any) => {
                            // Ignore any elements that might cause issues
                            return element.tagName === 'SCRIPT' || element.tagName === 'LINK';
                          }
                        },
                        jsPDF: { 
                          unit: 'mm', 
                          format: 'a4', 
                          orientation: 'portrait' 
                        }
                      };
                      
                      // Generate PDF from iframe content
                      await html2pdf().set(options).from(iframeDoc.body).save();
                      
                      // Clean up iframe
                      if (iframe.parentNode === document.body) {
                        document.body.removeChild(iframe);
                      }
                      
                    } catch (fallbackError) {
                      console.error('Erreur avec la méthode de secours:', fallbackError);
                      alert('Erreur lors de la génération du PDF. Fonctionnalité temporairement indisponible.');
                    }
                  }
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
