import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import i18n from "@/lib/i18n/config";

export type Theme = "light" | "dark" | "system";
export type FontSize = "sm" | "md" | "lg";
export type Locale = "fr" | "en" | "ar";

const FONT_SCALES: Record<FontSize, number> = { sm: 0.875, md: 1, lg: 1.125 };

interface Settings {
  theme: Theme;
  fontSize: FontSize;
  locale: Locale;
  setTheme: (t: Theme) => void;
  setFontSize: (s: FontSize) => void;
  setLocale: (l: Locale) => void;
}

const SettingsContext = createContext<Settings | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("theme") as Theme) || "light";
}

function getInitialFontSize(): FontSize {
  if (typeof window === "undefined") return "md";
  return (localStorage.getItem("fontSize") as FontSize) || "md";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

function applyFontSize(size: FontSize) {
  document.documentElement.style.fontSize = `${FONT_SCALES[size]}rem`;
}

function applyLocale(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale === "ar" ? "ar" : locale === "en" ? "en" : "fr";
  root.dir = locale === "ar" ? "rtl" : "ltr";
  i18n.changeLanguage(locale);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [fontSize, setFontSizeState] = useState<FontSize>(getInitialFontSize);
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "fr";
    return (localStorage.getItem("locale") as Locale) || "fr";
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s);
    localStorage.setItem("fontSize", s);
    applyFontSize(s);
  };

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    applyLocale(l);
  };

  useEffect(() => { applyTheme(theme); }, []);
  useEffect(() => { applyFontSize(fontSize); }, []);
  useEffect(() => { applyLocale(locale); }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <SettingsContext.Provider value={{ theme, fontSize, locale, setTheme, setFontSize, setLocale }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}