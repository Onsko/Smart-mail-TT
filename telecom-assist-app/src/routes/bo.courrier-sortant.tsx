import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Upload, Loader2 } from "lucide-react";
import { courriersApi, uploadDocument, type CreateCourrierPayload } from "@/lib/api";

export const Route = createFileRoute("/bo/courrier-sortant")({
  component: CourrierSortantPage,
});

function today() {
  return new Date().toISOString().split("T")[0];
}

function CourrierSortantPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateCourrierPayload>({
    type: "SORTANT",
    date: today(),
    nombrePieces: 1,
    correspondant: "",
    objet: "",
    contenu: "",
    observation: "",
    documents: [],
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function update<K extends keyof CreateCourrierPayload>(field: K, value: CreateCourrierPayload[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (!selected) return;
    setUploading(true);
    setMessage(null);
    try {
      const uploaded = await uploadDocument(selected);
      update("documents", [uploaded.url]);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t("bo.outgoing.uploadError") });
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await courriersApi.create(form);
      setMessage({ type: "success", text: t("bo.outgoing.success") });
      setForm({
        type: "SORTANT",
        date: today(),
        nombrePieces: 1,
        correspondant: "",
        objet: "",
        contenu: "",
        observation: "",
        documents: [],
      });
      setFile(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t("bo.outgoing.serverError") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <form onSubmit={submit} className="rounded-xl bg-card border shadow-sm p-6">
        <h2 className="font-display text-xl font-semibold">{t("bo.outgoing.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("bo.outgoing.desc")}</p>

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
          <Field label={t("bo.outgoing.dateDepart")}>
            <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inp} />
          </Field>
          <Field label={t("bo.outgoing.nbPieces")}>
            <input
              type="number"
              min={1}
              value={form.nombrePieces}
              onChange={(e) => update("nombrePieces", Number(e.target.value))}
              className={inp}
            />
          </Field>
          <Field label={t("bo.outgoing.destinataire")} className="sm:col-span-2">
            <input value={form.correspondant} onChange={(e) => update("correspondant", e.target.value)} className={inp} placeholder={t("bo.outgoing.destinatairePlaceholder")} />
          </Field>
          <Field label={t("bo.outgoing.objet")} className="sm:col-span-2">
            <input value={form.objet} onChange={(e) => update("objet", e.target.value)} className={inp} placeholder={t("bo.outgoing.objetPlaceholder")} />
          </Field>
          <Field label={t("bo.outgoing.contenu")} className="sm:col-span-2">
            <textarea
              rows={6}
              value={form.contenu}
              onChange={(e) => update("contenu", e.target.value)}
              className={inp + " resize-none"}
              placeholder={t("bo.outgoing.contenuPlaceholder")}
            />
          </Field>
          <Field label={t("bo.outgoing.observation")} className="sm:col-span-2">
            <textarea
              rows={3}
              value={form.observation}
              onChange={(e) => update("observation", e.target.value)}
              className={inp + " resize-none"}
              placeholder={t("bo.outgoing.observationPlaceholder")}
            />
          </Field>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium block mb-1.5">{t("bo.outgoing.document")}</label>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer hover:bg-accent/40 transition">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">{t("bo.outgoing.uploadHint")} <span className="text-primary-bright font-medium">{t("bo.outgoing.uploadBrowse")}</span></span>
            <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
          </label>
          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
                {t("bo.outgoing.uploading")}
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
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => setFile(null)}>
            {t("bo.outgoing.cancel")}
          </button>
          <button type="submit" disabled={loading} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60">
            {loading ? t("bo.outgoing.saving") : t("bo.outgoing.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

const inp = "w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="text-sm font-medium block mb-1.5">{label}</label>{children}</div>;
}
