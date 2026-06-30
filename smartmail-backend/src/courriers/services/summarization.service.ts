import { Injectable } from '@nestjs/common';

const STOP_WORDS = new Set([
  'le','la','les','de','du','des','un','une','et','en','dans','pour','par','sur','avec','sans','que','qui','quoi','dont','où',
  'ce','cet','cette','ces','mon','ton','son','ma','ta','sa','mes','tes','ses','notre','votre','leur','nos','vos','leurs',
  'je','tu','il','elle','nous','vous','ils','elles','on','ne','pas','plus','moins','très','trop','peu','tout','tous','toute','toutes',
  'autre','autres','même','tel','telle','est','sont','été','être','avoir','fait','faire','ont','ai','as','avons','avez','suis','sommes',
  'au','aux','se','sa','si','ou','car','donc','mais','comme','aussi','afin','lors','vers','chez','entre','depuis','pendant','selon',
  'the','a','an','and','of','to','in','for','on','at','by','with','from','that','this','is','are','was','were','be','have','has','had',
]);

@Injectable()
export class SummarizationService {
  summarize(text: string, objet?: string, maxSentences = 3): string {
    if (!text) return '';
    let sentences = this.splitSentences(text);

    // Drop sentences that are essentially a repeat of the objet (already shown as title)
    if (objet) {
      const objetNorm = this.normalize(objet);
      const filtered = sentences.filter((s) => this.normalize(s) !== objetNorm);
      if (filtered.length > 0) sentences = filtered;
    }

    if (sentences.length <= maxSentences) return sentences.join(' ').trim() || text.trim();

    const tokens = sentences.map((s) => this.tokenize(s));
    const scores = this.textRank(tokens);

    if (objet) {
      const objetTokens = this.tokenize(objet);
      for (let i = 0; i < sentences.length; i++) {
        const overlap = objetTokens.filter((t) => tokens[i].includes(t)).length;
        if (overlap > 0) scores[i] += 0.15 * overlap;
      }
    }

    // Penalize salutations / closings / boilerplate that carry no real information
    for (let i = 0; i < sentences.length; i++) {
      if (this.isBoilerplate(sentences[i])) scores[i] -= 1;
    }

    const ranked = scores
      .map((score, idx) => ({ score, idx }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.idx - b.idx);

    const selected = ranked.map((r) => sentences[r.idx]).join(' ');
    return selected.length > 600 ? selected.slice(0, 600).trim() + '…' : selected;
  }

  private textRank(tokens: string[][]): number[] {
    const n = tokens.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const sim = this.similarity(tokens[i], tokens[j]);
        matrix[i][j] = sim;
        matrix[j][i] = sim;
      }
    }

    // Normalize rows so outgoing weights sum to 1
    const rowSums = matrix.map((row) => row.reduce((acc, v) => acc + v, 0));

    const damping = 0.85;
    let scores = new Array(n).fill(1 / n);

    for (let iter = 0; iter < 30; iter++) {
      const next = new Array(n).fill((1 - damping) / n);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j || matrix[j][i] === 0 || rowSums[j] === 0) continue;
          next[i] += damping * (matrix[j][i] / rowSums[j]) * scores[j];
        }
      }
      scores = next;
    }

    return scores;
  }

  private similarity(a: string[], b: string[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const setB = new Set(b);
    let common = 0;
    const seen = new Set<string>();
    for (const w of a) {
      if (seen.has(w)) continue;
      seen.add(w);
      if (setB.has(w)) common++;
    }
    const denom = Math.log(a.length + 1) + Math.log(b.length + 1);
    return denom === 0 ? 0 : common / denom;
  }

  private splitSentences(text: string): string[] {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s+/g, '$1\n')
      .split('\n')
      .map((s) => this.stripIntro(this.stripSalutation(s.trim())))
      .filter((s) => s.length > 12);
  }

  private stripSalutation(sentence: string): string {
    // Remove a leading salutation/title fragment glued to the first sentence,
    // e.g. ", Monsieur, Dans le cadre...", "Madame, Monsieur, Je vous...",
    // or a leftover role like "Technique, Je me permets..." (from "Monsieur le Responsable Technique,").
    const titleWords = new Set([
      'madame', 'monsieur', 'mesdames', 'messieurs', 'mademoiselle', 'cher', 'chere', 'chers',
      'le', 'la', 'les', 'responsable', 'directeur', 'directrice', 'chef', 'service', 'gerant',
      'president', 'presidente', 'technique', 'commercial', 'commerciale', 'general', 'generale',
    ]);

    let result = sentence.replace(/^[\s,]+/, '');
    const commaIdx = result.indexOf(',');
    if (commaIdx > 0 && commaIdx < 60) {
      const prefix = result.slice(0, commaIdx).trim();
      const words = prefix
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/\s+/)
        .filter(Boolean);
      if (words.length > 0 && words.length <= 5 && words.every((w) => titleWords.has(w))) {
        result = result.slice(commaIdx + 1).trim();
      }
    }

    return result
      .replace(/^[\s,]+/, '')
      .replace(/^([a-zàâçéèêëîïôùûü])/, (m) => m.toUpperCase());
  }

  private stripIntro(sentence: string): string {
    // Remove a leading polite intro clause but keep the informative remainder,
    // e.g. "Je me permets de vous signaler un incident..." -> "Un incident..."
    const intro =
      /^(je me permets de vous |jai lhonneur de vous |je vous |permettez moi de vous )(signaler|solliciter|informer|contacter|ecrire|faire part|porter a votre connaissance|aviser)\s*(que |de |du |des |dun |dune |au sujet de |concernant |sur )?/i;
    const cleaned = sentence.replace(intro, '');
    if (cleaned !== sentence && cleaned.length > 12) {
      return cleaned.replace(/^([a-zàâçéèêëîïôùûü])/, (m) => m.toUpperCase());
    }
    return sentence;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-zàâçéèêëîïôùûü0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-zàâçéèêëîïôùûü0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isBoilerplate(sentence: string): boolean {
    const s = this.normalize(sentence);
    const patterns = [
      'monsieur le directeur',
      'madame monsieur',
      'madame la directrice',
      'je me permets de vous adresser ce courrier',
      'je vous prie dagreer',
      'veuillez agreer',
      'salutations distinguees',
      'mes salutations',
      'expression de mes',
      'dans lattente',
      'dans cette attente',
      'restant a votre disposition',
      'je vous remercie par avance',
      'cordialement',
      'bien cordialement',
    ];
    return patterns.some((p) => s.includes(p));
  }
}
