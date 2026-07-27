import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import { setSession, ROLE_HOME, type Role } from "@/lib/auth";
import { authApi, saveToken } from "@/lib/api";
import { Mail, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Smart Mail" },
      { name: "description", content: "Connectez-vous à Smart Mail, la plateforme de gestion du courrier de Tunisie Telecom." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      saveToken(res.access_token);
      const svc = typeof res.user.service === 'object' && res.user.service ? res.user.service : null;
      setSession({
        name: `${res.user.prenom} ${res.user.nom}`,
        email: res.user.email,
        role: res.user.role as Role,
        service: svc?.name,
        serviceId: svc?._id,
      });
      navigate({ to: ROLE_HOME[res.user.role as Role] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("login.error"));
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
            {t("login.leftTitle")}
          </h2>
          <p className="mt-5 text-white/70 text-base leading-relaxed">
            {t("login.leftDesc")}
          </p>
        </div>
        <div className="relative z-10 text-xs text-white/50">
          {t("login.leftFooter")}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="font-display text-3xl font-bold">{t("login.welcome")}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{t("login.welcomeDesc")}</p>

          <div className="mt-8 space-y-5">
            <Field label={t("login.email")} icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                className="w-full bg-transparent outline-none text-sm py-2.5"
              />
            </Field>

            <Field
              label={t("login.password")}
              icon={<Lock className="h-4 w-4" />}
              right={<a href="#" className="text-xs text-primary-bright hover:underline">{t("login.forgotPassword")}</a>}
            >
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? t("login.loggingIn") : <><span>{t("login.submit")}</span> <ArrowRight className="h-4 w-4" /></>}
            </button>

            <div className="text-center text-sm">
              {t("login.clientPrompt")}{" "}
              <Link to="/client/login" className="text-primary-bright font-medium hover:underline">
                {t("login.clientAccess")}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, icon, right, children }: { label: string; icon: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium">{label}</label>
        {right}
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  );
}
