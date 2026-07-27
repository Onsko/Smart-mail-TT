import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { genRef } from "@/lib/mockData";

export const Route = createFileRoute("/client/deposer")({
  component: DeposerPage,
});

function DeposerPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSent(genRef());
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl bg-card border shadow-sm p-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-success/15 text-teal-700 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold">{t("deposit.successTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("deposit.successDesc")}</p>
        <div className="mt-5 inline-block rounded-lg bg-muted px-5 py-3 font-mono text-lg">{sent}</div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setSent(null)} className="rounded-md border px-4 py-2 text-sm">{t("deposit.newMail")}</button>
          <a href="/client/suivi" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">{t("deposit.trackNow")}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">{t("deposit.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("deposit.desc")}</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-card border shadow-sm p-6 space-y-4">
        <Field label={t("deposit.name")}><input required className={inp} placeholder={t("deposit.namePlaceholder")} /></Field>
        <Field label={t("deposit.type")}>
          <select className={inp}>
            <option>{t("deposit.client")}</option><option>{t("deposit.supplier")}</option><option>{t("deposit.partner")}</option><option>STEG</option><option>{t("deposit.organization")}</option>
          </select>
        </Field>
        <Field label={t("deposit.subject")}><input required className={inp} placeholder={t("deposit.subjectPlaceholder")} /></Field>
        <Field label={t("deposit.description")}><textarea required rows={5} className={inp + " resize-none"} placeholder={t("deposit.descriptionPlaceholder")} /></Field>
        <div>
          <label className="text-sm font-medium block mb-1.5">{t("deposit.document")}</label>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer hover:bg-accent/40 transition">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">{t("deposit.uploadHint")} <span className="text-primary-bright font-medium">{t("deposit.uploadBrowse")}</span></span>
            <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-md border bg-accent/30 p-3 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium truncate flex-1">{file.name}</span>
            </div>
          )}
        </div>
        <button className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-semibold">{t("deposit.submit")}</button>
      </form>
    </div>
  );
}

const inp = "w-full rounded-md border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium block mb-1.5">{label}</label>{children}</div>;
}
