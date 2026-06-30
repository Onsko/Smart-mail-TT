import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { clearSession, getSession, ROLE_LABEL, type Role, type SessionUser } from "@/lib/auth";
import {
  LayoutDashboard, Users, Building2, Inbox, Send, Mail,
  ClipboardList, KanbanSquare, UserCog, FileText, Search, LogOut, Menu, X, Sparkles
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";

type NavItem = { to: string; label: string; icon: ReactNode };

const NAV: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { to: "/admin", label: "Tableau de bord", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/admin/utilisateurs", label: "Utilisateurs", icon: <Users className="h-4 w-4" /> },
    { to: "/admin/services", label: "Services", icon: <Building2 className="h-4 w-4" /> },
  ],
  BO: [
    { to: "/bo", label: "Tableau de bord", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/bo/courrier-entrant", label: "Courrier entrant", icon: <Inbox className="h-4 w-4" /> },
    { to: "/bo/courrier-sortant", label: "Courrier sortant", icon: <Send className="h-4 w-4" /> },
  ],
  DIRECTEUR: [
    { to: "/directeur", label: "À affecter", icon: <ClipboardList className="h-4 w-4" /> },
  ],
  CHEF: [
    { to: "/chef", label: "Kanban service", icon: <KanbanSquare className="h-4 w-4" /> },
    { to: "/chef/affectation-agent", label: "Affectation agent", icon: <UserCog className="h-4 w-4" /> },
  ],
  AGENT: [
    { to: "/agent", label: "Mes courriers", icon: <Mail className="h-4 w-4" /> },
  ],
  CLIENT: [
    { to: "/client/deposer", label: "Déposer un courrier", icon: <FileText className="h-4 w-4" /> },
    { to: "/client/suivi", label: "Suivi", icon: <Search className="h-4 w-4" /> },
  ],
};

interface Props {
  role: Role;
  title?: string;
}

export function AppShell({ role, title }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      // Demo: auto-create a session for the role so routes are visitable directly
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
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="mt-6 px-3">
            <div className="rounded-lg bg-sidebar-accent/40 p-3 text-xs text-white/80">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                <Sparkles className="h-3.5 w-3.5 text-ai" /> Assistant IA
              </div>
              Résumés, classement et suggestions sont alimentés par l'IA.
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
              <div className="text-[11px] text-white/60 truncate">{ROLE_LABEL[role]}</div>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-white/10" aria-label="Déconnexion">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex-1">
              <h1 className="font-display text-lg font-semibold">{title ?? ROLE_LABEL[role]}</h1>
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
