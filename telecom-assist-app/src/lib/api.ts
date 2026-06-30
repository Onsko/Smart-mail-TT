const BASE = 'http://localhost:3000/api';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('smartmail.token');
    return raw ?? null;
  } catch { return null; }
}

export function saveToken(token: string) {
  localStorage.setItem('smartmail.token', token);
}

export function removeToken() {
  localStorage.removeItem('smartmail.token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');
  return data as T;
}

export interface ApiUser {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  service: string | null;
  actif: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: ApiUser;
}

export interface RegisterClientPayload {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  registerClient: (payload: RegisterClientPayload) =>
    request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload: ResetPasswordPayload) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request<ApiUser>('/auth/me'),
};

export interface CreateUserPayload {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string;
  service?: string;
}

export const usersApi = {
  getAll: () => request<ApiUser[]>('/users'),
  create: (payload: CreateUserPayload) =>
    request<ApiUser>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStatus: (id: string, actif: boolean) =>
    request<ApiUser>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ actif }),
    }),
  updateRole: (id: string, role: string) =>
    request<ApiUser>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  delete: (id: string) =>
    request<void>(`/users/${id}`, { method: 'DELETE' }),
};

export type CourrierType = 'ENTRANT' | 'SORTANT';
export type CourrierCategorie = 'RECLAMATION' | 'DEMANDE' | 'FACTURE' | 'INFORMATION' | 'AUTRE';
export type CourrierDomaine = 'TECHNIQUE' | 'RH' | 'FINANCE' | 'COMMERCIAL' | 'AUTRE';
export type CourrierPriorite = 'HAUTE' | 'MOYENNE' | 'BASSE';
export type CourrierStatut = 'NOUVEAU' | 'A_AFFECTER' | 'A_TRAITER' | 'EN_COURS' | 'TRAITE' | 'REJETE' | 'EN_ATTENTE' | 'CLOTURE';

export interface CreateCourrierPayload {
  type: CourrierType;
  date?: string;
  nombrePieces?: number;
  correspondant?: string;
  objet: string;
  contenu?: string;
  observation?: string;
  categorie?: CourrierCategorie;
  domaine?: CourrierDomaine;
  priorite?: CourrierPriorite;
  statut?: CourrierStatut;
  documents?: string[];
}

export interface Courrier {
  _id: string;
  reference: string;
  type: CourrierType;
  date?: string;
  nombrePieces?: number;
  correspondant?: string;
  objet: string;
  contenu?: string;
  observation?: string;
  categorie?: CourrierCategorie;
  domaine?: CourrierDomaine;
  priorite?: CourrierPriorite;
  statut?: CourrierStatut;
  service?: { _id: string; code: string; name: string } | null;
  agentAssigne?: { _id: string; nom: string; prenom: string; email: string } | null;
  resumeIA?: string;
  documents?: string[];
  historique?: { action: string; date: string; user?: string }[];
  extractionsIA?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedFields {
  correspondant: string;
  objet: string;
  contenu: string;
  categorie: CourrierCategorie;
  domaine: CourrierDomaine;
  priorite: CourrierPriorite;
  date?: string;
  lieu?: string;
}

export interface Service {
  _id: string;
  code: string;
  name: string;
  description?: string;
  agents?: { _id: string; nom: string; prenom: string; email: string }[];
}

export interface Recommendation {
  resume: string;
  serviceId: string | null;
  serviceCode: string | null;
  serviceName: string | null;
  priorite: CourrierPriorite;
  similarCount: number;
  source: 'ollama' | 'heuristique';
}

export interface OllamaExtraction extends ExtractedFields {
  resume: string;
  serviceCode: string | null;
  serviceName: string | null;
  serviceId: string | null;
  source: 'ollama' | 'heuristique';
}

export interface OllamaStatus {
  available: boolean;
  model: string;
}

export const courriersApi = {
  getAll: () => request<Courrier[]>('/courriers'),
  getById: (id: string) => request<Courrier>(`/courriers/${id}`),
  create: (payload: CreateCourrierPayload) =>
    request<Courrier>('/courriers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  attachDocument: (id: string, url: string) =>
    request<Courrier>(`/courriers/${id}/documents`, {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),
  extract: (id: string, url: string, mimeType: string) =>
    request<ExtractedFields>(`/courriers/${id}/extraire`, {
      method: 'POST',
      body: JSON.stringify({ url, mimeType }),
    }),
  extractStandalone: (url: string, mimeType: string) =>
    request<ExtractedFields>('/courriers/extraire', {
      method: 'POST',
      body: JSON.stringify({ url, mimeType }),
    }),
  getOllamaStatus: () => request<OllamaStatus>('/courriers/ollama/status'),
  analyzeWithOllama: (url: string, mimeType: string) =>
    request<OllamaExtraction>('/courriers/analyse-ollama', {
      method: 'POST',
      body: JSON.stringify({ url, mimeType }),
    }),
  getPendingForDirector: () => request<Courrier[]>('/courriers/directeur/pending'),
  getRecommendations: (id: string) => request<Recommendation>(`/courriers/${id}/recommandations`),
  reanalyserOllama: (id: string) => request<Recommendation>(`/courriers/${id}/reanalyser-ollama`, { method: 'POST' }),
  assignService: (id: string, service: string, agentAssigne?: string) =>
    request<Courrier>(`/courriers/${id}/affecter`, {
      method: 'PATCH',
      body: JSON.stringify({ service, agentAssigne }),
    }),
  validateDirector: (id: string, priorite?: CourrierPriorite) =>
    request<Courrier>(`/courriers/${id}/valider`, {
      method: 'PATCH',
      body: JSON.stringify({ priorite }),
    }),
};

export const servicesApi = {
  getAll: () => request<Service[]>('/services'),
};

export async function uploadDocument(file: File): Promise<{ url: string; filename: string; originalName: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/courriers/documents/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Erreur upload');
  return data;
}
