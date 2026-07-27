import i18n from "./i18n/config";

export type Role = "SUPER_ADMIN" | "BO" | "DIRECTEUR" | "CHEF" | "AGENT" | "CLIENT";

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/admin",
  BO: "/bo",
  DIRECTEUR: "/directeur",
  CHEF: "/chef",
  AGENT: "/agent",
  CLIENT: "/client/deposer",
};

export function getRoleLabel(role: Role): string {
  return i18n.t(`roles.${role}`);
}

export interface SessionUser {
  name: string;
  email: string;
  role: Role;
  service?: string;
  serviceId?: string;
}

const KEY = "smartmail.session";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch { return null; }
}

export function setSession(u: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(u));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}
