import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";
import { clearSession, getSession, getRoleLabel, type Role, type SessionUser } from "@/lib/auth";
import { useSettings, type FontSize, type Locale, type Theme } from "@/hooks/use-settings";
import {
  LayoutDashboard, Users, Building2, Inbox, Send, Mail,
  ClipboardList, KanbanSquare, UserCog, FileText, Search, LogOut, Menu, X, Sparkles,
  Sun, Moon, Monitor, Type, Languages, Minus, Plus, Palette
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";

type NavItem = { to: string; labelKey: string; icon: ReactNode };

const NAV: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { to: "/admin", labelKey: "nav.dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/admin/utilisateurs", labelKey: "nav.users", icon: <Users className="h-4 w-4" /> },
    { to: "/admin/services", labelKey: "nav.services", icon: <Building2 className="h-4 w-4" /> },
  ],
  BO: [
    { to: "/bo", labelKey: "nav.dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/bo/courrier-entrant", labelKey: "nav.incoming", icon: <Inbox className="h-4 w-4" /> },
    { to: "/bo/courrier-sortant", labelKey: "nav.outgoing", icon: <Send className="h-4 w-4" /> },
  ],
  DIRECTEUR: [
    { to: "/directeur", labelKey: "nav.toAffect", icon: <ClipboardList className="h-4 w-4" /> },
  ],
  CHEF: [
    { to: "/chef", labelKey: "nav.kanban", icon: <KanbanSquare className="h-4 w-4" /> },
    { to: "/chef/affectation-agent", labelKey: "nav.affectAgent", icon: <UserCog className="h-4 w-4" /> },
  ],
  AGENT: [
    { to: "/agent", labelKey: "nav.myMails", icon: <Mail className="h-4 w-4" /> },
  ],
  CLIENT: [
    { to: "/client/deposer", labelKey: "nav.deposit", icon: <FileText className="h-4 w-4" /> },
    { to: "/client/suivi", labelKey: "nav.tracking", icon: <Search className="h-4 w-4" /> },
  ],
};

interface Props {
  role: Role;
  title?: string;
}

const THEMES: { key: Theme; icon: ReactNode }[] = [
  { key: "light", icon: <Sun className="h-3.5 w-3.5" /> },
  { key: "dark", icon: <Moon className="h-3.5 w-3.5" /> },
  { key: "system", icon: <Monitor className="h-3.5 w-3.5" /> },
];

const FONT_SIZES: { key: FontSize; label: string }[] = [
  { key: "sm", label: "A" },
  { key: "md", label: "A" },
  { key: "lg", label: "A" },
];

const LOCALES: { key: Locale; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "ar", label: "ع" },
];

export function AppShell({ role, title }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, fontSize, locale, setTheme, setFontSize, setLocale } = useSettings();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      const fallback: SessionUser = {
        name: "Utilisateur Démo",
        email: `${role.toLowerCase()}@tunisietelecom.tn`,
        role,
        service: role === "CHEF" || role === "AGENT" ? "Technique" : undefined,
      };
      setUser(fallback);
    } else {
      setUser(s);
    }
  }, [role]);

  const items = NAV[role];

  function handleLogout() {
    clearSession();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground
        flex flex-col transition-transform lg:translate-x-0
        ${locale === "ar" ? "lg:translate-x-0 right-0 left-auto" : ""}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="px-5 py-5 border-b border-sidebar-border/40">
          <Logo variant="light" />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(item => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                  ${active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white"}`}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <div className="mt-6 px-3">
            <div className="rounded-lg bg-sidebar-accent/40 p-3 text-xs text-white/80">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("shell.aiAssistant")}
              </div>
              {t("shell.aiDesc")}
            </div>
          </div>
        </nav>
        <div className="border-t border-sidebar-border/40 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold">
              {user?.name?.split(" ").map(s => s[0]).slice(0, 2).join("") ?? "TT"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.name ?? "—"}</div>
              <div className="text-[11px] text-white/60 truncate">{getRoleLabel(role)}</div>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-white/10" aria-label={t("shell.logout")}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b">
          <div className="flex items-center gap-1.5 px-4 lg:px-8 h-16">
            <button className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent" onClick={() => setMobileOpen(v => !v)} aria-label={t("shell.menu")}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex-1">
              <h1 className="font-display text-lg font-semibold">{title ?? getRoleLabel(role)}</h1>
            </div>

            {/* Font size controls */}
            <div className="flex items-center gap-0.5 mr-1">
              {FONT_SIZES.map(fs => (
                <button
                  key={fs.key}
                  onClick={() => setFontSize(fs.key)}
                  className={`px-1.5 py-1 rounded text-xs font-bold transition-colors
                    ${fontSize === fs.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                    ${fs.key === "sm" ? "text-[10px]" : fs.key === "lg" ? "text-sm" : "text-xs"}`}
                  title={t("fontSize." + fs.key)}
                >
                  {fs.label}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <div className="flex items-center gap-0.5 mr-1 rounded-md border p-0.5">
              {THEMES.map(th => (
                <button
                  key={th.key}
                  onClick={() => setTheme(th.key)}
                  className={`p-1.5 rounded-sm transition-colors
                    ${theme === th.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title={t("theme." + th.key)}
                >
                  {th.icon}
                </button>
              ))}
            </div>

            {/* Language selector */}
            <div className="flex items-center gap-0.5 mr-2 rounded-md border p-0.5">
              {LOCALES.map(loc => (
                <button
                  key={loc.key}
                  onClick={() => setLocale(loc.key)}
                  className={`px-1.5 py-1 rounded-sm text-xs font-medium transition-colors
                    ${locale === loc.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title={t("language." + loc.key)}
                >
                  {loc.label}
                </button>
              ))}
            </div>

            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
