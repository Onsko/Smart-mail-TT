import { Injectable, Logger } from '@nestjs/common';

// Result returned by the LLM. Every field is optional because the model output
// is validated and any missing/invalid value falls back to the heuristic layer.
export interface OllamaAnalysis {
  correspondant?: string;
  date?: string;
  lieu?: string;
  objet?: string;
  contenu?: string;
  categorie?: string;
  domaine?: string;
  priorite?: string;
  resume?: string;
  serviceCode?: string;
}

const VALID_CATEGORIES = ['RECLAMATION', 'DEMANDE', 'FACTURE', 'INFORMATION', 'AUTRE'];
const VALID_DOMAINES = ['TECHNIQUE', 'RH', 'FINANCE', 'COMMERCIAL', 'AUTRE'];
const VALID_PRIORITES = ['HAUTE', 'MOYENNE', 'BASSE'];
const VALID_SERVICES = ['TECHNIQUE', 'RH', 'FINANCE', 'COMMERCIAL'];

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private readonly model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

  // Quick liveness probe so the frontend can enable/disable the Ollama button.
  async isAvailable(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, { method: 'GET' }, 1500);
      return res.ok;
    } catch {
      return false;
    }
  }

  getModelName(): string {
    return this.model;
  }

  // Ask the local LLM to extract structured fields + summary + target service.
  // Returns null on any failure so the caller keeps the heuristic result.
  async analyzeCourrier(text: string): Promise<OllamaAnalysis | null> {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    const prompt = this.buildPrompt(trimmed.slice(0, 6000));

    try {
      const res = await this.fetchWithTimeout(
        `${this.baseUrl}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            prompt,
            stream: false,
            format: 'json',
            options: { temperature: 0.1 },
          }),
        },
        45000,
      );

      if (!res.ok) {
        this.logger.warn(`Ollama a répondu ${res.status}`);
        return null;
      }

      const data = (await res.json()) as { response?: string };
      if (!data.response) return null;

      this.logger.debug(`Réponse Ollama brute (200 premiers caractères) : ${data.response.slice(0, 200)}`);
      return this.parseAndValidate(data.response);
    } catch (err) {
      this.logger.warn(`Appel Ollama échoué : ${(err as Error).message}`);
      return null;
    }
  }

  // Reformulate / rephrase text using the LLM. Returns null on failure.
  async reformuler(text: string): Promise<string | null> {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    const prompt = [
      'Tu es un assistant administratif tunisien. Reformule le texte suivant de manière plus professionnelle,',
      'courtoise et claire, en gardant le même sens. Renvoie UNIQUEMENT le texte reformulé, sans commentaire.',
      '',
      'TEXTE :',
      '"""',
      trimmed.slice(0, 4000),
      '"""',
    ].join('\n');

    return this.generateText(prompt);
  }

  // Summarize text using the LLM. Returns null on failure.
  async resumer(text: string): Promise<string | null> {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    const prompt = [
      'Tu es un assistant administratif tunisien. Fais un résumé clair et concis (3-5 phrases) du texte suivant.',
      'Renvoie UNIQUEMENT le résumé, sans commentaire.',
      '',
      'TEXTE :',
      '"""',
      trimmed.slice(0, 4000),
      '"""',
    ].join('\n');

    return this.generateText(prompt);
  }

  // Generate a draft response for a courrier. Returns null on failure.
  async genererReponse(objet: string, contenu: string): Promise<string | null> {
    const prompt = [
      'Tu es un assistant administratif de Tunisie Telecom. Rédige une réponse professionnelle,',
      'courtoise et complète au courrier suivant. La réponse doit être en français, formatée avec',
      'une formule d\'appel, le corps du message et une formule de politesse.',
      'Renvoie UNIQUEMENT la réponse, sans commentaire.',
      '',
      `Objet du courrier : ${objet}`,
      `Contenu : ${contenu || '(non fourni)'}`,
    ].join('\n');

    return this.generateText(prompt);
  }

  private async generateText(prompt: string): Promise<string | null> {
    try {
      const res = await this.fetchWithTimeout(
        `${this.baseUrl}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            prompt,
            stream: false,
            options: { temperature: 0.3 },
          }),
        },
        60000,
      );

      if (!res.ok) {
        this.logger.warn(`Ollama a répondu ${res.status}`);
        return null;
      }

      const data = (await res.json()) as { response?: string };
      if (!data.response) return null;
      return data.response.trim();
    } catch (err) {
      this.logger.warn(`Appel Ollama échoué : ${(err as Error).message}`);
      return null;
    }
  }

  private buildPrompt(text: string): string {
    return [
      'Tu es un assistant administratif tunisien spécialisé dans le tri du courrier entrant pour un opérateur télécom.',
      'Analyse le COURRIER ci-dessous et renvoie UNIQUEMENT un objet JSON valide, sans texte autour.',
      '',
      'Champs attendus :',
      '- correspondant : nom de l\'expéditeur (personne qui signe en bas), sinon "".',
      '- date : date du courrier au format AAAA-MM-JJ, sinon "".',
      '- lieu : ville d\'émission, sinon "".',
      '- objet : objet du courrier, concis, sans formule de politesse.',
      '- contenu : le corps utile du message, nettoyé des salutations et formules de politesse.',
      `- categorie : une valeur parmi ${VALID_CATEGORIES.join(', ')}.`,
      `- domaine : une valeur parmi ${VALID_DOMAINES.join(', ')}.`,
      `- priorite : une valeur parmi ${VALID_PRIORITES.join(', ')} (HAUTE si urgence, panne, litige, mise en demeure).`,
      '- resume : un résumé en 2 ou 3 phrases claires, en français, des points clés et de la demande.',
      `- serviceCode : le service le plus adapté pour traiter ce courrier, parmi ${VALID_SERVICES.join(', ')}.`,
      '  Règles service : pannes/fibre/réseau/messagerie => TECHNIQUE ; factures/paiements/remboursement => FINANCE ;',
      '  offres/contrats/résiliation/partenariat/clients => COMMERCIAL ; personnel/recrutement/congés => RH.',
      '',
      'COURRIER :',
      '"""',
      text,
      '"""',
    ].join('\n');
  }

  private parseAndValidate(raw: string): OllamaAnalysis | null {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(this.extractJson(raw));
    } catch {
      this.logger.warn('Réponse Ollama non parsable en JSON');
      return null;
    }

    const str = (v: unknown): string | undefined => {
      if (typeof v !== 'string') return undefined;
      const t = v.trim();
      return t.length ? t : undefined;
    };
    const enumOf = (v: unknown, allowed: string[]): string | undefined => {
      const s = str(v)?.toUpperCase();
      return s && allowed.includes(s) ? s : undefined;
    };

    const result: OllamaAnalysis = {
      correspondant: str(parsed.correspondant),
      date: this.normalizeDate(str(parsed.date)),
      lieu: str(parsed.lieu),
      objet: str(parsed.objet),
      contenu: str(parsed.contenu),
      categorie: enumOf(parsed.categorie, VALID_CATEGORIES),
      domaine: enumOf(parsed.domaine, VALID_DOMAINES),
      priorite: enumOf(parsed.priorite, VALID_PRIORITES),
      resume: str(parsed.resume),
      serviceCode: enumOf(parsed.serviceCode, VALID_SERVICES),
    };

    // Require at least a usable summary or objet to consider the call successful.
    if (!result.resume && !result.objet) return null;
    return result;
  }

  // Models sometimes wrap JSON in prose or code fences; keep the JSON object only.
  private extractJson(raw: string): string {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) return candidate.slice(start, end + 1);
    return candidate;
  }

  private normalizeDate(value?: string): string | undefined {
    if (!value) return undefined;
    const iso = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const fr = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`;
    return undefined;
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
