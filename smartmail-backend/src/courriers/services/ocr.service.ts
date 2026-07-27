import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

export interface ExtractionResult {
  correspondant: string;
  objet: string;
  contenu: string;
  categorie: string;
  domaine: string;
  priorite: string;
  date?: string;
  lieu?: string;
}

const MONTHS: Record<string, string> = {
  janvier: '01', fevrier: '02', mars: '03', avril: '04', mai: '05', juin: '06',
  juillet: '07', aout: '08', septembre: '09', octobre: '10', novembre: '11', decembre: '12',
  جانفي: '01', فيفري: '02', مارس: '03', أفريل: '04', ماي: '05', جوان: '06',
  جويلية: '07', أوت: '08', سبتمبر: '09', أكتوبر: '10', نوفمبر: '11', ديسمبر: '12',
};

// Major Tunisian cities, normalized (no accents/case) for matching.
const TUNISIAN_CITIES = new Set([
  'tunis', 'ariana', 'ben arous', 'la soukra', 'ennasr', 'manouba', 'bizerte', 'nabeul',
  'hammamet', 'sousse', 'monastir', 'mahdia', 'sfax', 'gabes', 'medenine', 'tataouine',
  'gafsa', 'tozeur', 'kebili', 'kairouan', 'kasserine', 'sidi bouzid', 'beja', 'jendouba',
  'le kef', 'siliana', 'zaghouan', 'djerba', 'zarzis', 'douz',
  'تونس', 'أريانة', 'بن عروس', 'سكرة', 'المنار', 'منوبة', 'بنزرت', 'نابل',
  'حمامات', 'سوسة', 'المنستير', 'المهدية', 'صفاقس', 'قابس', 'مدنين', 'تطاوين',
  'قفصة', 'توزر', 'قبلي', 'القيروان', 'القصرين', 'سيدي بوزيد', 'باجة', 'جندوبة',
  'الكاف', 'سليانة', 'زغوان', 'جربة', 'زرزيس', 'دوز',
]);

// Day numbers written in French words ("vingt-trois" -> 23).
const FRENCH_DAY_WORDS: Record<string, number> = {
  premier: 1, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8,
  neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19, vingt: 20, 'vingt-et-un': 21,
  'vingt-deux': 22, 'vingt-trois': 23, 'vingt-quatre': 24, 'vingt-cinq': 25,
  'vingt-six': 26, 'vingt-sept': 27, 'vingt-huit': 28, 'vingt-neuf': 29, trente: 30,
  'trente-et-un': 31,
};

@Injectable()
export class OcrService implements OnModuleDestroy {
  private readonly logger = new Logger(OcrService.name);
  private readonly IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
  private worker: any = null;

  async extractFromDocument(filePath: string, mimeType: string): Promise<ExtractionResult> {
    const rawText = await this.extractRawText(filePath, mimeType);
    return this.analyzeText(rawText);
  }

  // Returns the raw OCR/PDF text without analysis (used by the Ollama layer).
  async extractRawText(filePath: string, mimeType: string): Promise<string> {
    this.logger.log(`Extraction texte du document : ${filePath} (${mimeType})`);
    let rawText = '';

    if (mimeType === 'application/pdf') {
      try {
        const parse = pdfParse as unknown as (buffer: Buffer) => Promise<{ text: string }>;
        const data = await parse(fs.readFileSync(filePath));
        rawText = data.text || '';
      } catch (err) {
        this.logger.warn(`Lecture PDF échouée : ${(err as Error).message}`);
      }
    } else if (this.IMAGE_TYPES.includes(mimeType)) {
      try {
        const worker = await this.getWorker();
        const result = await worker.recognize(filePath);
        rawText = result.data.text || '';
      } catch (err) {
        this.logger.warn(`OCR image échoué : ${(err as Error).message}`);
      }
    }

    return rawText || '';
  }

  // Public wrapper so other services can reuse the heuristic analysis on raw text.
  analyze(text: string): ExtractionResult {
    return this.analyzeText(text || '');
  }

  private async getWorker() {
    if (!this.worker) {
      this.worker = await (Tesseract as any).createWorker('ara+fra+eng');
    }
    return this.worker;
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }

  private analyzeText(text: string): ExtractionResult {
    // Keep line structure for positional parsing; use a collapsed copy only for keywords.
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const clean = text.replace(/\s+/g, ' ').trim();
    const lower = clean.toLowerCase();

    let categorie = 'AUTRE';
    if (this.containsAny(lower, ['réclamation', 'reclamation', 'plainte', 'شكاية', 'تظلم', 'شكوى'])) categorie = 'RECLAMATION';
    else if (this.containsAny(lower, ['demande', 'demand', 'solicitation', 'sollicitation', 'طلب', 'مطلب', 'التماس'])) categorie = 'DEMANDE';
    else if (this.containsAny(lower, ['facture', 'facturation', 'montant', 'prix', 'paiement', 'فاتورة', 'فاتور', 'تسديد'])) categorie = 'FACTURE';
    else if (this.containsAny(lower, ['information', 'informations', 'note', 'lettre', 'معلومات', 'إعلام', 'إشعار', 'بلاغ'])) categorie = 'INFORMATION';

    const domaine = this.detectDomaine(lower);

    let priorite = 'MOYENNE';
    if (this.containsAny(lower, ['urgent', 'critique', 'immédiat', 'immediat', 'sans délai', 'priorité haute', 'panne', 'hors service', 'paralyse', 'pertes financières', 'dans les plus brefs délais', 'عاجل', 'هام جدا', 'طارئ', 'فوري', 'ضروري', 'فورا', 'التدخل السريع', 'حالا', 'سريعا', 'فورية', 'عاجلة', 'مستعجل'])) priorite = 'HAUTE';
    else if (this.containsAny(lower, ['relance', 'rappel', 'réitération', 'non respect', 'délai dépassé', 'تذكير', 'متابعة', 'إنذار', 'إخطار'])) priorite = 'HAUTE';
    else if (this.containsAny(lower, ['basse', 'peu urgent', 'à titre informatif', 'منخفض', 'غير عاجل', 'للمعلومة'])) priorite = 'BASSE';

    const { date, lieu } = this.extractDateLieu(lines);
    const objet = this.extractObjet(lines, clean);
    const correspondant = this.extractSender(lines);
    const contenu = this.buildContent(clean, objet);

    return {
      correspondant: correspondant || 'Non détecté',
      objet: objet || 'Objet non détecté',
      contenu,
      categorie,
      domaine,
      priorite,
      date: date || undefined,
      lieu: lieu || undefined,
    };
  }

  // Extract the date/place header, e.g. "Tunis, le 29 juin 2026", "Sfax, le 03/07/2026",
  // or a place written on its own line ("Sousse"). Line-aware so a preceding label
  // (e.g. "À l'attention du Service Clientèle") does not pollute the place.
  private extractDateLieu(lines: string[]): { date?: string; lieu?: string } {
    let date: string | undefined;
    let lieu: string | undefined;

    // Scan the header area (first lines) for the date, capturing the place when glued.
    for (const line of lines.slice(0, 10)) {
      if (date) break;
      // "Ville, le 29 juin 2026"
      let lm = line.match(/^([A-Za-zÀ-ÿ'’\-\s\u0600-\u06FF]{2,40}?)\s*,\s*le\s+([\wûéèàôî\-]+)\s+([A-Za-zûéèàôî]+)\s+(\d{4})/i);
      if (lm) {
        date = this.toIsoDate(this.parseDay(lm[2]), lm[3], lm[4]);
        lieu = this.cleanLieu(lm[1]);
        continue;
      }
      // "Ville, le 03/07/2026"
      lm = line.match(/^([A-Za-zÀ-ÿ'’\-\s\u0600-\u06FF]{2,40}?)\s*,\s*le\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
      if (lm) {
        date = `${lm[4]}-${lm[3].padStart(2, '0')}-${lm[2].padStart(2, '0')}`;
        lieu = this.cleanLieu(lm[1]);
        continue;
      }
      // "Ville en date du 29 juin 2026"
      lm = line.match(/^([\u0600-\u06FF\s]{2,40}?)\s+(?:في|بتاريخ)\s+(\d{1,2})\s+([\u0600-\u06FF]+)\s+(\d{4})/);
      if (lm) {
        date = this.toIsoDate(lm[2], lm[3], lm[4]);
        lieu = lm[1].trim();
        continue;
      }
      // "le 29 juin 2026" (no place on this line)
      lm = line.match(/\ble\s+([\wûéèàôî\-]+)\s+([A-Za-zûéèàôî]+)\s+(\d{4})/i);
      if (lm) {
        date = this.toIsoDate(this.parseDay(lm[1]), lm[2], lm[3]);
        continue;
      }
      // "Date : 30/06/2026" or bare "30/06/2026"
      lm = line.match(/(?:date\s*:\s*)?\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/i);
      if (lm) {
        date = `${lm[3]}-${lm[2].padStart(2, '0')}-${lm[1].padStart(2, '0')}`;
        continue;
      }
      // Arabic: "تونس في 29-06-2026" or "تونس 29/06/2026"
      lm = line.match(/^([\u0600-\u06FF\s]{2,40}?)\s+(?:في|بتاريخ)?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (lm) {
        date = `${lm[4]}-${lm[3].padStart(2, '0')}-${lm[2].padStart(2, '0')}`;
        lieu = lm[1].trim();
        continue;
      }
    }

    // If the place was on its own line, find a header line that is exactly a known city.
    if (!lieu) {
      for (const line of lines.slice(0, 12)) {
        const norm = this.normalizeCity(line);
        if (TUNISIAN_CITIES.has(norm)) {
          lieu = line.replace(/[,;.].*$/, '').trim();
          break;
        }
      }
    }

    return { date, lieu };
  }

  // "Service Clientèle Sfax" -> "Sfax"; validates against the known-city list when possible.
  private cleanLieu(raw: string): string {
    const cleaned = this.cleanValue(raw);
    const norm = this.normalizeCity(cleaned);
    if (TUNISIAN_CITIES.has(norm)) return cleaned;
    // Keep only the last 1-2 words if the tail is a known city (handles glued labels).
    const words = cleaned.split(/\s+/);
    for (let take = 1; take <= 2 && take <= words.length; take++) {
      const tail = words.slice(words.length - take).join(' ');
      if (TUNISIAN_CITIES.has(this.normalizeCity(tail))) return tail;
    }
    return cleaned;
  }

  private normalizeCity(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[,;.].*$/, '')
      .trim();
  }

  // Accepts a numeric day ("23") or a French word ("vingt-trois").
  private parseDay(token: string): string {
    if (/^\d{1,2}$/.test(token)) return token;
    const key = token.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const n = FRENCH_DAY_WORDS[key];
    return n ? String(n) : token;
  }

  // Weighted keyword scoring so the dominant theme wins instead of the first
  // matched keyword (e.g. a commercial proposal that incidentally mentions "internet").
  private detectDomaine(lower: string): string {
    const groups: Record<string, { kw: string; w: number }[]> = {
      COMMERCIAL: [
        { kw: 'proposition de partenariat', w: 4 }, { kw: 'partenariat', w: 3 },
        { kw: 'catalogue', w: 3 }, { kw: 'devis', w: 3 }, { kw: 'offre groupée', w: 3 },
        { kw: 'offre commerciale', w: 3 }, { kw: 'tarifs', w: 2 }, { kw: 'tarif', w: 2 },
        { kw: 'promotion', w: 2 }, { kw: 'vente', w: 2 }, { kw: 'abonnement', w: 2 },
        { kw: 'souscription', w: 1 }, { kw: 'offre', w: 1 }, { kw: 'commercial', w: 2 },
        // Contrats et litiges contractuels relèvent du Commercial (relations clients/contrats).
        { kw: 'mise en demeure', w: 3 }, { kw: 'résiliation', w: 3 }, { kw: 'resiliation', w: 3 },
        { kw: 'contrat', w: 2 }, { kw: 'contractuel', w: 2 }, { kw: 'engagements contractuels', w: 3 },
        { kw: 'contentieux', w: 2 },
        // Arabe
        { kw: 'عرض', w: 3 }, { kw: 'اشتراك', w: 2 }, { kw: 'عقد', w: 2 },
        { kw: 'إلغاء', w: 3 }, { kw: 'شراكة', w: 3 }, { kw: 'تعريفة', w: 2 },
        { kw: 'أسعار', w: 2 }, { kw: 'بيع', w: 2 }, { kw: 'زبون', w: 2 },
        { kw: 'عملاء', w: 2 }, { kw: 'تسويق', w: 2 }, { kw: 'تجاري', w: 2 },
      ],
      TECHNIQUE: [
        { kw: 'panne', w: 3 }, { kw: 'coupure', w: 3 }, { kw: 'dysfonctionnement', w: 3 },
        { kw: 'incident technique', w: 3 }, { kw: 'fibre', w: 2 }, { kw: 'ftth', w: 2 },
        { kw: 'adsl', w: 2 }, { kw: 'raccordement', w: 2 }, { kw: 'installation', w: 2 },
        { kw: 'messagerie', w: 3 }, { kw: 'webmail', w: 3 }, { kw: 'email', w: 2 },
        { kw: 'migration', w: 2 }, { kw: 'authentification', w: 2 }, { kw: 'connectivité', w: 1 },
        { kw: 'connectivite', w: 1 }, { kw: 'connexion', w: 1 }, { kw: 'internet', w: 1 },
        { kw: 'réseau', w: 1 }, { kw: 'reseau', w: 1 }, { kw: 'débit', w: 2 }, { kw: 'debit', w: 2 },
        { kw: 'couverture mobile', w: 2 }, { kw: 'technique', w: 1 },
        // Arabe
        { kw: 'عطب', w: 3 }, { kw: 'أعطاب', w: 3 }, { kw: 'انقطاع', w: 3 },
        { kw: 'خلل', w: 3 }, { kw: 'ألياف', w: 2 }, { kw: 'اتصال', w: 1 },
        { kw: 'إنترنت', w: 1 }, { kw: 'شبكة', w: 1 }, { kw: 'ربط', w: 2 },
        { kw: 'تركيب', w: 2 }, { kw: 'بريد', w: 3 }, { kw: 'تقني', w: 1 },
        { kw: 'صيانة', w: 2 }, { kw: 'تطبيق', w: 1 }, { kw: 'هاتف', w: 1 },
        { kw: 'جوال', w: 1 },
      ],
      FINANCE: [
        { kw: 'facture', w: 3 }, { kw: 'facturation', w: 3 }, { kw: 'paiement', w: 2 },
        { kw: 'remboursement', w: 2 }, { kw: 'montant', w: 1 }, { kw: 'comptable', w: 2 },
        { kw: 'budget', w: 1 }, { kw: 'frais', w: 1 }, { kw: 'impayé', w: 2 },
        // Arabe
        { kw: 'فاتورة', w: 3 }, { kw: 'فواتير', w: 3 }, { kw: 'تسديد', w: 2 },
        { kw: 'دفع', w: 2 }, { kw: 'استرجاع', w: 2 }, { kw: 'مبلغ', w: 1 },
        { kw: 'محاسبة', w: 2 }, { kw: 'ميزانية', w: 1 }, { kw: 'مصاريف', w: 1 },
        { kw: 'متخلدات', w: 2 }, { kw: 'ديون', w: 2 },
      ],
      RH: [
        { kw: 'ressources humaines', w: 3 }, { kw: 'recrutement', w: 3 }, { kw: 'salaire', w: 2 },
        { kw: 'congé', w: 2 }, { kw: 'personnel', w: 1 }, { kw: 'accident de travail', w: 3 },
        { kw: 'arrêt maladie', w: 3 }, { kw: 'médecin du travail', w: 3 },
        { kw: 'candidature', w: 4 }, { kw: 'offre d\'emploi', w: 3 },
        { kw: 'poste à pourvoir', w: 3 }, { kw: 'curriculum vitae', w: 3 }, { kw: 'cv', w: 2 },
        { kw: 'embauche', w: 3 }, { kw: 'recrute', w: 2 },
        { kw: 'recruteur', w: 2 }, { kw: 'stage', w: 2 }, { kw: 'stagiaire', w: 2 },
        { kw: 'contrat de travail', w: 2 }, { kw: 'postuler', w: 3 },
        // Arabe
        { kw: 'توظيف', w: 4 }, { kw: 'انتداب', w: 4 }, { kw: 'مطلب شغل', w: 3 },
        { kw: 'منصب شغل', w: 3 }, { kw: 'مترشح', w: 3 }, { kw: 'ترشح', w: 3 },
        { kw: 'سيرة ذاتية', w: 3 }, { kw: 'راتب', w: 2 }, { kw: 'أجير', w: 2 },
        { kw: 'إجازة', w: 2 }, { kw: 'عطلة', w: 2 }, { kw: 'موارد بشرية', w: 3 },
        { kw: 'شؤون اجتماعية', w: 2 }, { kw: 'تكوين', w: 2 }, { kw: 'تأديب', w: 2 },
      ],
    };

    let best = 'AUTRE';
    let bestScore = 0;
    for (const [domaine, kws] of Object.entries(groups)) {
      const score = kws.reduce((acc, { kw, w }) => (lower.includes(kw) ? acc + w : acc), 0);
      if (score > bestScore) {
        bestScore = score;
        best = domaine;
      }
    }
    return best;
  }

  // Prefer the dedicated "Objet :" line (most reliable, never bleeds into the
  // body). Fall back to the collapsed-text regex, then to content inference.
  private extractObjet(lines: string[], clean: string): string {
    for (const line of lines) {
      const lm = line.match(/^\s*(?:objet|sujet|concerne|subject|object|الموضوع|بخصوص|في شأن|شأن)\s*:?\s*(.+)$/i);
      if (lm && lm[1].trim().length > 3) {
        // The objet stops at the salutation if both share the same line.
        const value = lm[1].split(
          /\s+(?:monsieur|madame|mesdames|messieurs|mademoiselle|bonjour|cher|ch[eè]re|chers|السيد|السيدة|السياد|حضرة)\b/i,
        )[0];
        return this.cleanValue(value);
      }
    }
    const m = clean.match(
      /\b(?:objet|sujet|concerne|subject|object|الموضوع|بخصوص|في شأن|شأن)\s*:?\s*(.+?)(?=\s+(?:monsieur|madame|mesdames|messieurs|mademoiselle|bonjour|cher|ch[eè]re|chers|à\s+l['’]attention|je\s+me\s+permets|je\s+vous|nous\s+vous|par\s+la\s+pr[eé]sente|السيد|السيدة|السياد|حضرة)\b|[.!?]\s|$)/i,
    );
    if (m && m[1].trim().length > 3) return this.cleanValue(m[1]);
    return this.inferObjetFromContent(clean);
  }

  private toIsoDate(day: string, monthName: string, year: string): string | undefined {
    const key = monthName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const month = MONTHS[key];
    if (!month) return undefined;
    return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  // The sender of an incoming letter is the signature at the bottom, not the
  // recipient salutation at the top.
  private extractSender(lines: string[]): string {
    // Try explicit labels first.
    for (const line of lines) {
      const m = line.match(/^(?:de|exp[ée]diteur|nom de l['’]exp[ée]diteur|from|sender)\s*:\s*(.+)/i);
      if (m && m[1].trim()) return this.extractName(m[1]);
    }

    // Otherwise, read the signature from the bottom upward.
    for (let i = lines.length - 1; i >= 0 && i >= lines.length - 6; i--) {
      const line = lines[i];
      if (this.isClosing(line) || this.isSalutation(line)) continue;
      if (line.length < 3 || line.length > 90) continue;
      const name = this.extractName(line);
      if (name && (/[A-Za-zÀ-ÿ]/.test(name) || /[\u0600-\u06FF]/.test(name))) return name;
    }
    return '';
  }

  // Keep the human name part: before a dash, slash, comma or role keyword.
  private extractName(raw: string): string {
    let v = raw.split(/[—–\-\/|]/)[0];
    v = v.split(/,/)[0];
    return this.cleanValue(v);
  }

  private isClosing(line: string): boolean {
    const s = line.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return /(salutations|cordialement|agreer|comptant sur|dans l['’ ]attente|veuillez|je vous remercie|sentiments|respectueuses|وتفضلوا|وتقبلوا|الإحترام|التقدير|المخلص|سلام|تحياتي|احتراماتي|محترم)/.test(s);
  }

  private isSalutation(line: string): boolean {
    const s = line.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return /^(monsieur|madame|mesdames|messieurs|mademoiselle|cher|chere|chers|a l['’ ]attention|السيد|السيدة|السياد|حضرة|سعادة)/.test(s);
  }

  private inferObjetFromContent(text: string): string {
    const m = text.match(/(?:demande de|demande d'|sujet de|concernant|relatif à|relative à|pour|afin de|بخصوص|في شأن|شأن)\s+([^.,;:!?]{5,80})/i);
    if (m) return this.cleanValue(m[0]);
    return this.firstSentence(text);
  }

  private buildContent(clean: string, objet: string): string {
    if (!clean) return '';
    let body = clean;

    // Start the body after the objet value (if present in the text).
    if (objet) {
      const idx = clean.toLowerCase().indexOf(objet.toLowerCase());
      if (idx >= 0) body = clean.slice(idx + objet.length);
    }

    // Drop a leading recipient salutation block, e.g. "Monsieur le Responsable Technique,".
    body = body.replace(
      /^[\s,:.\-]*(?:(?:monsieur|madame|mesdames|messieurs|mademoiselle|cher|ch[eè]re|chers|à\s+l['’]attention[^,]*|السيد|السيدة|السياد|حضرة|سعادة)[^,]*,\s*)+/i,
      '',
    );

    // Cut off the closing formula and signature at the end.
    const close = body.match(
      /\b(comptant sur|veuillez agr[eé]er|je vous prie d['’]agr[eé]er|dans l['’ ]attente|je vous remercie|cordialement|salutations|sentiments|وتفضلوا|وتقبلوا|الإحترام|التقدير|المخلص|سلام|تحياتي|احتراماتي)/i,
    );
    if (close && close.index !== undefined && close.index > 50) {
      body = body.slice(0, close.index);
    }

    return body
      .replace(/^[\s:.\-]+/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);
  }

  private firstSentence(text: string): string {
    const m = text.match(/[^.!?]{10,200}[.!?]/);
    return m ? m[0].trim() : '';
  }

  private cleanValue(value: string): string {
    return value.replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  private containsAny(text: string, words: string[]): boolean {
    return words.some((w) => text.includes(w.toLowerCase()));
  }
}
