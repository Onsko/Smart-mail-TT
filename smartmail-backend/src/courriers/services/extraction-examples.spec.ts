import { OcrService } from './ocr.service';
import { SummarizationService } from './summarization.service';
import { RecommendationService } from './recommendation.service';
import { OllamaService } from './ollama.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Extraction robustness on diverse courriers', () => {
  const ocr = new OcrService();
  const summarizer = new SummarizationService();
  const ollamaStub = { analyzeCourrier: () => null, isAvailable: () => false, getModelName: () => 'test' } as unknown as OllamaService;
  const recommendation = new RecommendationService({} as any, {} as any, summarizer, ollamaStub);

  const examplesPath = path.join(__dirname, '../../../test/examples-courriers-divers.txt');
  const raw = fs.readFileSync(examplesPath, 'utf-8');

  const examples = raw
    .split(/={80,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 100 && block.includes('Objet'))
    .map((block, index) => {
      const titleMatch = block.match(/^EXEMPLE\s*\d+\s*—\s*(.+)$/m);
      return {
        id: index + 1,
        title: titleMatch ? titleMatch[1].trim() : `Exemple ${index + 1}`,
        text: block.replace(/^EXEMPLE\s*\d+\s*—\s*.+$/m, '').trim(),
      };
    });

  it.each(examples)('exemple $id — $title', ({ text }) => {
    const extraction = (ocr as any).analyzeText(text);
    const summary = summarizer.summarize(extraction.contenu, extraction.objet, 3);
    const priorite = (recommendation as any).inferPriority(`${extraction.objet || ''} ${extraction.contenu || ''}`);

    console.log('\n---');
    console.log('Objet:', extraction.objet);
    console.log('Date:', extraction.date);
    console.log('Lieu:', extraction.lieu);
    console.log('Expéditeur:', extraction.correspondant);
    console.log('Catégorie:', extraction.categorie);
    console.log('Domaine:', extraction.domaine);
    console.log('Priorité:', extraction.priorite, '| re-inférée:', priorite);
    console.log('Résumé:', summary);
    console.log('Contenu extrait (début):', extraction.contenu.slice(0, 160), '...');
    console.log('---');

    expect(extraction.objet).not.toBe('Objet non détecté');
    expect(extraction.correspondant).not.toBe('Non détecté');
    expect(extraction.contenu.length).toBeGreaterThan(20);
    expect(summary.length).toBeGreaterThan(10);
  });
});
