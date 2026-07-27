import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n/config";
import { Logo } from "@/components/Logo";
import { setSession, ROLE_HOME, type Role } from "@/lib/auth";
import { authApi, saveToken } from "@/lib/api";
import { Mail, Lock, User, ArrowRight, KeyRound } from "lucide-react";

export const Route = createFileRoute("/client/login")({
  head: () => ({
    meta: [
      { title: i18n.t("clientLogin.metaTitle") },
      { name: "description", content: i18n.t("clientLogin.metaDesc") },
    ],
  }),
  component: ClientLoginPage,
});

function ClientLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError(t("clientLogin.passwordsNotMatch"));
      return;
    }
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await authApi.login(email, password)
          : await authApi.registerClient({ nom, prenom, email, password });
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
      setError(err instanceof Error ? err.message : t("clientLogin.error"));
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
            {t("clientLogin.leftTitle")}
          </h2>
          <p className="mt-5 text-white/70 text-base leading-relaxed">
            {t("clientLogin.leftDesc")}
          </p>
        </div>
        <div className="relative z-10 text-xs text-white/50">
          {t("clientLogin.leftFooter")}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="font-display text-3xl font-bold">{t("clientLogin.title")}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{t("clientLogin.desc")}</p>

          <div className="mt-6 flex rounded-lg border p-1 bg-muted">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                mode === "login" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t("clientLogin.tabLogin")}
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                mode === "register" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t("clientLogin.tabRegister")}
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("clientLogin.firstName")} icon={<User className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={prenom}
                    onChange={e => setPrenom(e.target.value)}
                    placeholder={t("clientLogin.firstName")}
                    required
                    className="w-full bg-transparent outline-none text-sm py-2.5"
                  />
                </Field>
                <Field label={t("clientLogin.lastName")} icon={<User className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder={t("clientLogin.lastName")}
                    required
                    className="w-full bg-transparent outline-none text-sm py-2.5"
                  />
                </Field>
              </div>
            )}

            <Field label={t("clientLogin.email")} icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("clientLogin.emailPlaceholder")}
                required
                className="w-full bg-transparent outline-none text-sm py-2.5"
              />
            </Field>

            <Field
              label={t("clientLogin.password")}
              icon={<Lock className="h-4 w-4" />}
              right={
                <Link to="/client/forgot-password" className="text-xs text-primary-bright hover:underline">
                  {t("clientLogin.forgotPassword")}
                </Link>
              }
            >
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("clientLogin.passwordMin")}
                required
                minLength={6}
                className="w-full bg-transparent outline-none text-sm py-2.5"
              />
            </Field>

            {mode === "register" && (
              <Field label={t("clientLogin.confirmPassword")} icon={<Lock className="h-4 w-4" />}>
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
            )}

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
              {loading ? (
                mode === "login" ? t("clientLogin.loggingIn") : t("clientLogin.registering")
              ) : (
                <>
                  <span>{mode === "login" ? t("clientLogin.submitLogin") : t("clientLogin.submitRegister")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-sm">
              {t("clientLogin.agentPrompt")}{" "}
              <Link to="/login" className="text-primary-bright font-medium hover:underline">
                {t("clientLogin.internalLogin")}
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
