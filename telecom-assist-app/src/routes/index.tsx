import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import { ArrowRight, Sparkles, Layers, Activity } from "lucide-react";
import logo from "@/assets/tt-logo-transparent.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Mail — Tunisie Telecom" },
      { name: "description", content: "La gestion du courrier de Tunisie Telecom, simplifiée par l'IA." },
      { property: "og:title", content: "Smart Mail — Tunisie Telecom" },
      { property: "og:description", content: "Centralisation, orientation IA et suivi temps réel des courriers administratifs." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-hero-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
        <header className="relative z-20 max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-6">
          <Logo variant="light" size={52} />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 transition"
            >
              {t("landing.login")}
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-white text-primary-deep px-4 py-2 text-sm font-semibold shadow-lg shadow-black/10 hover:bg-white/90 transition"
            >
              {t("landing.createAccount")}
            </Link>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-10 lg:pt-16 pb-40 lg:pb-56 grid lg:grid-cols-[1.3fr_1fr] xl:grid-cols-[1.8fr_1fr] 2xl:grid-cols-[1.9fr_1fr] gap-6 items-center">
          <div className="order-2 lg:order-1 flex justify-center lg:justify-end lg:-ml-20 xl:-ml-32 2xl:-ml-40">
            <img
              src={logo}
              alt="Logo Tunisie Telecom"
              className="w-[460px] sm:w-[560px] lg:w-full max-w-[1100px] h-auto object-contain drop-shadow-2xl"
            />
          </div>

          <div className="order-1 lg:order-2 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-xs font-medium text-white/90">
              <span className="h-2 w-2 rounded-full bg-ai animate-pulse" />
              {t("landing.heroSubtitle")}
            </span>
            <h1 className="mt-5 font-display font-extrabold text-white text-5xl sm:text-6xl lg:text-6xl 2xl:text-7xl leading-[0.95] tracking-tight">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-5 text-lg text-white/75 max-w-md">
              {t("landing.heroDesc")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white text-primary-deep px-5 py-3 text-sm font-semibold shadow-lg shadow-black/10 hover:bg-white/90 transition"
              >
                {t("landing.login")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/client/login"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/40 text-white px-5 py-3 text-sm font-semibold hover:bg-white/15 transition"
              >
                {t("landing.clientAccess")}
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-white/85">
              {[
                { icon: <Layers className="h-3.5 w-3.5" />, key: "featureCentralization" },
                { icon: <Sparkles className="h-3.5 w-3.5" />, key: "featureAiOrientation" },
                { icon: <Activity className="h-3.5 w-3.5" />, key: "featureTracking" },
              ].map((f, i) => (
                <div key={f.key} className="flex items-center gap-3">
                  {i > 0 && <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-white/30" />}
                  <div className="flex items-center gap-2">
                    <span className="text-ai">{f.icon}</span>
                    <span className="text-xs font-medium tracking-wide">{t("landing." + f.key)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden>
          <path d="M0,80 C360,10 1080,140 1440,40 L1440,110 L0,110 Z" fill="#ffffff" />
        </svg>
      </section>

      <section className="relative pt-20 lg:pt-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
              {t("landing.section2Title")}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              {t("landing.section2Desc")}
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-primary-deep to-primary-bright text-white p-8 shadow-xl">
            <Sparkles className="h-6 w-6 text-ai" />
            <p className="mt-3 font-display text-xl font-semibold leading-snug">
              {t("landing.section2Quote")}
            </p>
            <p className="mt-3 text-white/70 text-sm">{t("landing.section2Footer")}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid md:grid-cols-[1.4fr_1fr_1fr] gap-10">
          <div>
            <Logo size={44} />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              {t("landing.footerDesc")}
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">{t("landing.footerProduct")}</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-primary-bright">{t("landing.login")}</Link></li>
              <li><Link to="/client/login" className="hover:text-primary-bright">{t("landing.clientAccess")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">{t("landing.footerSupport")}</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-bright">{t("landing.footerHelp")}</a></li>
              <li><a href="#" className="hover:text-primary-bright">{t("landing.footerContact")}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
            <div>{t("landing.footerBrand")}</div>
            <div>{t("landing.footerRights")}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
