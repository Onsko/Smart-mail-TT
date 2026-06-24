export const SERVICES = ["Technique", "Commercial", "RH", "Financier"] as const;
export type Service = typeof SERVICES[number];

export interface Courrier {
  id: string;
  ref: string;
  objet: string;
  expediteur: string;
  date: string;
  service: Service;
  priorite: "haute" | "moyenne" | "basse";
  statut: "nouveau" | "en_cours" | "en_attente" | "traite";
  resumeIA: string;
  serviceSuggere: Service;
  prioriteSuggere: "haute" | "moyenne" | "basse";
}

export const COURRIERS: Courrier[] = [
  { id: "1", ref: "TT-2026-0421", objet: "Réclamation facture janvier", expediteur: "Mohamed Trabelsi", date: "2026-06-18", service: "Commercial", priorite: "haute", statut: "nouveau",
    resumeIA: "Client conteste un dépassement de forfait de 47 DT. Demande remboursement.", serviceSuggere: "Commercial", prioriteSuggere: "haute" },
  { id: "2", ref: "TT-2026-0420", objet: "Demande de raccordement fibre", expediteur: "Société Médina SARL", date: "2026-06-18", service: "Technique", priorite: "moyenne", statut: "en_cours",
    resumeIA: "Demande de raccordement FTTH pour un local commercial — Avenue Bourguiba, Tunis.", serviceSuggere: "Technique", prioriteSuggere: "moyenne" },
  { id: "3", ref: "TT-2026-0419", objet: "Facture STEG juin 2026", expediteur: "STEG", date: "2026-06-17", service: "Financier", priorite: "moyenne", statut: "en_attente",
    resumeIA: "Facture mensuelle d'électricité — 12 480 DT, échéance 30 juin.", serviceSuggere: "Financier", prioriteSuggere: "moyenne" },
  { id: "4", ref: "TT-2026-0418", objet: "Candidature ingénieur réseau", expediteur: "Sarra Ben Ali", date: "2026-06-17", service: "RH", priorite: "basse", statut: "nouveau",
    resumeIA: "Candidature spontanée pour le poste d'ingénieur réseau, 4 ans d'expérience.", serviceSuggere: "RH", prioriteSuggere: "basse" },
  { id: "5", ref: "TT-2026-0417", objet: "Partenariat fibre — Sfax", expediteur: "Ooredoo Partners", date: "2026-06-16", service: "Technique", priorite: "haute", statut: "en_cours",
    resumeIA: "Proposition d'accord de mutualisation d'infrastructure fibre dans la région de Sfax.", serviceSuggere: "Technique", prioriteSuggere: "haute" },
  { id: "6", ref: "TT-2026-0416", objet: "Renouvellement marché support", expediteur: "DGSI", date: "2026-06-15", service: "Financier", priorite: "moyenne", statut: "traite",
    resumeIA: "Renouvellement du marché annuel de support infrastructure.", serviceSuggere: "Financier", prioriteSuggere: "moyenne" },
  { id: "7", ref: "TT-2026-0415", objet: "Demande de stage été", expediteur: "Institut ISI", date: "2026-06-14", service: "RH", priorite: "basse", statut: "traite",
    resumeIA: "Demande groupée de 12 stages d'été pour étudiants de l'ISI.", serviceSuggere: "RH", prioriteSuggere: "basse" },
  { id: "8", ref: "TT-2026-0414", objet: "Panne ligne Sousse Nord", expediteur: "Client professionnel", date: "2026-06-14", service: "Technique", priorite: "haute", statut: "en_cours",
    resumeIA: "Coupure récurrente d'une liaison entreprise — secteur Sousse Nord depuis 48h.", serviceSuggere: "Technique", prioriteSuggere: "haute" },
];

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: "BO" | "DIRECTEUR" | "CHEF" | "AGENT" | "CLIENT" | "SUPER_ADMIN";
  service?: Service | "—";
  actif: boolean;
}

export const UTILISATEURS: Utilisateur[] = [
  { id: "u1", nom: "Amine Jelassi", email: "amine.jelassi@tunisietelecom.tn", role: "SUPER_ADMIN", service: "—", actif: true },
  { id: "u2", nom: "Faten Bouzid", email: "faten.bouzid@tunisietelecom.tn", role: "BO", service: "—", actif: true },
  { id: "u3", nom: "Karim Hadj Ali", email: "karim.hadjali@tunisietelecom.tn", role: "DIRECTEUR", service: "—", actif: true },
  { id: "u4", nom: "Nadia Saïdi", email: "nadia.saidi@tunisietelecom.tn", role: "CHEF", service: "Technique", actif: true },
  { id: "u5", nom: "Yassine Khaldi", email: "yassine.khaldi@tunisietelecom.tn", role: "AGENT", service: "Technique", actif: true },
  { id: "u6", nom: "Olfa Romdhani", email: "olfa.romdhani@tunisietelecom.tn", role: "AGENT", service: "Commercial", actif: true },
  { id: "u7", nom: "Hatem Gharbi", email: "hatem.gharbi@tunisietelecom.tn", role: "CHEF", service: "Commercial", actif: false },
  { id: "u8", nom: "Rim Chaabane", email: "rim.chaabane@tunisietelecom.tn", role: "AGENT", service: "RH", actif: true },
  { id: "u9", nom: "Sami Mejri", email: "sami.mejri@tunisietelecom.tn", role: "AGENT", service: "Financier", actif: true },
];

export const AGENTS_SERVICE = [
  { id: "u5", nom: "Yassine Khaldi", charge: 7, recommended: true },
  { id: "a2", nom: "Mehdi Dridi", charge: 3, recommended: false },
  { id: "a3", nom: "Inès Ferchichi", charge: 5, recommended: false },
  { id: "a4", nom: "Bilel Trabelsi", charge: 9, recommended: false },
];

export function genRef() {
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `TT-2026-0${n}`;
}
