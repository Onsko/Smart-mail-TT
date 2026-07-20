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
    // Detect courrier type based on content and subject
    const courrierType = this.detectCourrierType(objet, contenu);
    
    const basePrompt = [
      'Tu es un représentant officiel du service clientèle de Tunisie Telecom, l\'opérateur historique de télécommunications en Tunisie.',
      'Tu dois rédiger une réponse officielle professionnelle à un courrier client.',
      '',
      '**CONTEXTE TUNISIE TELECOM:**',
      '- Opérateur historique fondé en 1995, leader des télécommunications en Tunisie',
      '- Services: Téléphonie fixe et mobile, Internet haut débit (ADSL/Fibre), Services entreprises',
      '- Plus de 6 millions d\'abonnés sur tout le territoire national',
      '',
      '**DÉLAIS STANDARDS:**',
      '- Interventions techniques: 24-48h ouvrées', 
      '- Traitement réclamations factures: 5-7 jours ouvrés',
      '- Contact conseiller commercial: 48h maximum',
      '- Résolution pannes réseau: Intervention immédiate si panne générale',
      ''
    ];

    // Add type-specific template
    const templateInstructions = this.getTemplateInstructions(courrierType);
    
    const prompt = [
      ...basePrompt,
      ...templateInstructions,
      '',
      '**ATTENTION: Tu représentes Tunisie Telecom. Ne reformule PAS le problème du client comme si c\'était le tien.**',
      '**Tu dois répondre EN TANT QUE Tunisie Telecom au client, pas décrire son problème.**',
      '',
      'COURRIER CLIENT REÇU:',
      `Objet : ${objet}`,
      `Message : ${contenu || '(non fourni)'}`,
      '',
      'RÉPONSE OFFICIELLE TUNISIE TELECOM:'
    ].join('\n');

    return this.generateText(prompt);
  }

  private detectCourrierType(objet: string, contenu: string): string {
    const text = `${objet} ${contenu}`.toLowerCase();
    
    // Réclamation technique (priorité haute)
    if (text.match(/panne|coupure|dysfonctionnement|hors service|ne fonctionne|problème technique|incident/)) {
      return 'RECLAMATION_TECHNIQUE';
    }
    
    // Contestation facture
    if (text.match(/facture|facturation|montant|trop élevé|conteste|erreur de facturation|surfacturation/)) {
      return 'FACTURE';
    }
    
    // Demande d'information
    if (text.match(/information|renseignement|détails|catalogue|offre|forfait|tarif|abonnement/)) {
      return 'DEMANDE_INFO';
    }
    
    // Réclamation générale
    if (text.match(/réclamation|plainte|mécontent|insatisfait|problème|difficulté/)) {
      return 'RECLAMATION';
    }
    
    return 'GENERAL';
  }

  private getTemplateInstructions(type: string): string[] {
    switch (type) {
      case 'RECLAMATION_TECHNIQUE':
        return [
          '**TEMPLATE RÉCLAMATION TECHNIQUE:**',
          '1. Accusé réception avec empathie ("Suite à votre signalement concernant...")',
          '2. Confirme prise en charge immédiate par équipes techniques',
          '3. Indique délai d\'intervention (24-48h selon complexité)',
          '4. Fournit référence de suivi (TT-2024-TECH-XXXX)',
          '5. Propose ligne d\'urgence si panne critique',
          '6. Excuse pour la gêne occasionnée'
        ];
      
      case 'FACTURE':
        return [
          '**TEMPLATE CONTESTATION FACTURE:**',
          '1. Accusé réception ("Nous avons bien reçu votre contestation...")',
          '2. Confirme analyse approfondie du dossier de facturation',
          '3. Indique délai de traitement (5-7 jours ouvrés)',
          '4. Mentionne geste commercial si justifié',
          '5. Fournit référence de dossier (TT-2024-FACT-XXXX)',
          '6. Coordonnées service facturation pour suivi'
        ];
      
      case 'DEMANDE_INFO':
        return [
          '**TEMPLATE DEMANDE INFORMATION:**',
          '1. Remercie pour l\'intérêt porté à nos services',
          '2. Confirme transmission des informations demandées',
          '3. Mentionne documentation jointe ou à envoyer',
          '4. Propose contact conseiller (sous 48h)',
          '5. Indique modalités de souscription si applicable',
          '6. Met à disposition numéro direct conseiller'
        ];
      
      case 'RECLAMATION':
        return [
          '**TEMPLATE RÉCLAMATION GÉNÉRALE:**',
          '1. Accusé réception avec considération ("Nous prenons en compte...")',
          '2. Confirme enquête interne appropriée',
          '3. Indique délai de retour selon nature du problème',
          '4. Propose geste de bonne volonté si approprié',
          '5. Fournit référence de suivi (TT-2024-REC-XXXX)',
          '6. Renouvelle engagement qualité de service'
        ];
      
      default:
        return [
          '**TEMPLATE GÉNÉRAL:**',
          '1. Accusé réception courtois ("Suite à votre courrier...")',
          '2. Traitement selon nature de la demande',
          '3. Délai de retour adapté',
          '4. Référence de suivi (TT-2024-GEN-XXXX)',
          '5. Coordonnées pour suivi',
          '6. Formule de politesse standard'
        ];
    }
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
