import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { authApi } from "@/lib/api";
import { Mail, Lock, KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/client/forgot-password")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Smart Mail" },
      { name: "description", content: "Réinitialisez votre mot de passe client Smart Mail." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setMessage(res.message);
      setStep("reset");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, newPassword });
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left */}
      <div className="relative hidden lg:flex flex-col bg-primary-deep text-white p-10 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
        <div className="relative z-10">
          <Logo variant="light" />
        </div>
        <div className="relative z-10 my-auto max-w-md">
          <div className="h-1.5 w-32 rounded-full mb-6"
            style={{ background: "linear-gradient(90deg,#FDB913,#D6377B,#8B3FA8,#2EC4B6,#1477C9)" }} />
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Retrouvez l'accès à votre espace client.
          </h2>
          <p className="mt-5 text-white/70 text-base leading-relaxed">
            Saisissez votre email, recevez un code de vérification et choisissez un nouveau mot de passe en toute sécurité.
          </p>
        </div>
        <div className="relative z-10 text-xs text-white/50">
          © 2026 Tunisie Telecom — Smart Mail
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="font-display text-3xl font-bold">Mot de passe oublié</h1>
          <p className="mt-2 text-muted-foreground text-sm">Réinitialisez votre mot de passe en deux étapes.</p>

          <div className="mt-8">
            {step === "request" && (
              <form onSubmit={requestCode} className="space-y-5">
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.tn"
                    required
                    className="w-full bg-transparent outline-none text-sm py-2.5"
                  />
                </Field>
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm py-3 hover:opacity-95 transition disabled:opacity-60"
                >
                  {loading ? "Envoi…" : <><span>Envoyer le code</span> <ArrowRight className="h-4 w-4" /></>}
                </button>
                <div className="text-center text-sm">
                  <Link to="/client/login" className="text-primary-bright font-medium hover:underline">
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={resetPassword} className="space-y-5">
                {message && (
                  <div className="rounded-md bg-success/10 border border-success/20 px-4 py-3 text-sm text-teal-700">
                    {message}
                  </div>
                )}
                <Field label="Code de vérification" icon={<KeyRound className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full bg-transparent outline-none text-sm py-2.5"
                  />
                </Field>
                <Field label="Nouveau mot de passe" icon={<Lock className="h-4 w-4" />}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                    className="w-full bg-transparent outline-none text-sm py-2.5"
                  />
                </Field>
                <Field label="Confirmer le mot de passe" icon={<Lock className="h-4 w-4" />}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-transparent outline-none text-sm py-2.5"
                  />
                </Field>
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm py-3 hover:opacity-95 transition disabled:opacity-60"
                >
                  {loading ? "Mise à jour…" : <><span>Modifier le mot de passe</span> <ArrowRight className="h-4 w-4" /></>}
                </button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("request")}
                    className="text-primary-bright font-medium hover:underline"
                  >
                    Renvoyer un code
                  </button>
                </div>
              </form>
            )}

            {step === "done" && (
              <div className="text-center space-y-5">
                <div className="mx-auto h-14 w-14 rounded-full bg-success/15 text-teal-700 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Mot de passe mis à jour</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                </div>
                <Link
                  to="/client/login"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm py-3 px-4 hover:opacity-95 transition"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium">{label}</label>
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  );
}
