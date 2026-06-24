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
