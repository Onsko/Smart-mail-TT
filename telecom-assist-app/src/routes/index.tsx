import { createFileRoute, Link } from "@tanstack/react-router";
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
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-hero-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
        <header className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-6">
          <Logo variant="light" />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 transition"
            >
              Se connecter
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-white text-primary-deep px-4 py-2 text-sm font-semibold shadow-lg shadow-black/10 hover:bg-white/90 transition"
            >
              Créer un compte
            </Link>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-10 lg:pt-16 pb-40 lg:pb-56 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          {/* Big logo visual */}
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start lg:-translate-x-16 xl:-translate-x-24">
            <img
              src={logo}
              alt="Logo Tunisie Telecom"
              className="w-[340px] sm:w-[420px] lg:w-[500px] xl:w-[560px] h-auto object-contain drop-shadow-2xl"
            />
          </div>

          <div className="order-1 lg:order-2 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-xs font-medium text-white/90">
              <span className="h-2 w-2 rounded-full bg-ai animate-pulse" />
              Gestion intelligente du courrier
            </span>
            <h1 className="mt-5 font-display font-extrabold text-white text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              Smart Mail
            </h1>
            <p className="mt-5 text-lg text-white/75 max-w-md">
              La gestion du courrier de Tunisie Telecom, simplifiée.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white text-primary-deep px-5 py-3 text-sm font-semibold shadow-lg shadow-black/10 hover:bg-white/90 transition"
              >
                Se connecter <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/client/login"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/40 text-white px-5 py-3 text-sm font-semibold hover:bg-white/15 transition"
              >
                Accès client
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-white/85">
              {[
                { icon: <Layers className="h-3.5 w-3.5" />, title: "Centralisation" },
                { icon: <Sparkles className="h-3.5 w-3.5" />, title: "Orientation IA" },
                { icon: <Activity className="h-3.5 w-3.5" />, title: "Suivi & visibilité" },
              ].map((f, i) => (
                <div key={f.title} className="flex items-center gap-3">
                  {i > 0 && <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-white/30" />}
                  <div className="flex items-center gap-2">
                    <span className="text-ai">{f.icon}</span>
                    <span className="text-xs font-medium tracking-wide">{f.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagonal transition */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden>
          <path d="M0,80 C360,10 1080,140 1440,40 L1440,110 L0,110 Z" fill="#ffffff" />
        </svg>
      </section>

      <section className="relative pt-20 lg:pt-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
              Un flux unique, du dépôt au traitement.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Smart Mail relie clients, bureau d'ordre, direction, chefs de service et agents
              dans un même flux, sécurisé et auditable.
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-primary-deep to-primary-bright text-white p-8 shadow-xl">
            <Sparkles className="h-6 w-6 text-ai" />
            <p className="mt-3 font-display text-xl font-semibold leading-snug">
              « Centralisez, suivez et traitez vos courriers en toute simplicité. »
            </p>
            <p className="mt-3 text-white/70 text-sm">Assistance IA intégrée — workflow optimisé.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid md:grid-cols-[1.4fr_1fr_1fr] gap-10">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Plateforme interne de gestion du courrier administratif de Tunisie Telecom.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">PRODUIT</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-primary-bright">Se connecter</Link></li>
              <li><Link to="/client/login" className="hover:text-primary-bright">Accès client</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">SUPPORT</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-bright">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-primary-bright">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
            <div>Smart Mail — Tunisie Telecom</div>
            <div>© 2026 Tous droits réservés.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
