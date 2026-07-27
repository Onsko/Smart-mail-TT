import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const saved = typeof window !== "undefined" ? localStorage.getItem("locale") : null;

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en }, ar: { translation: ar } },
  lng: saved || "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export default i18n;