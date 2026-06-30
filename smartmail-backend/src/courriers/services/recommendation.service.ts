import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Courrier, CourrierDocument, CourrierDomaine, CourrierPriorite, CourrierStatut } from '../schemas/courrier.schema';
import { Service, ServiceDocument } from '../../services/schemas/service.schema';
import { SummarizationService } from './summarization.service';
import { OllamaService } from './ollama.service';

export interface RecommendationResult {
  resume: string;
  serviceId: string | null;
  serviceCode: string | null;
  serviceName: string | null;
  priorite: CourrierPriorite;
  similarCount: number;
  source: 'ollama' | 'heuristique';
}

const VALID_SERVICE_CODES = ['TECHNIQUE', 'RH', 'FINANCE', 'COMMERCIAL'];

const DOMAIN_TO_SERVICE: Record<string, string> = {
  TECHNIQUE: 'TECHNIQUE',
  RH: 'RH',
  FINANCE: 'FINANCE',
  COMMERCIAL: 'COMMERCIAL',
};

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Courrier.name) private courrierModel: Model<CourrierDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    private summarizationService: SummarizationService,
    private ollamaService: OllamaService,
  ) {}

  // Fast heuristic-only recommendation (used for initial page load).
  async recommend(courrierId: string): Promise<RecommendationResult> {
    const courrier = await this.courrierModel.findById(courrierId).exec();
    if (!courrier) {
      throw new Error('Courrier introuvable');
    }

    const text = (courrier.contenu || '').trim() || courrier.objet || '';
    const resume = this.summarizationService.summarize(text, courrier.objet, 3);
    const serviceCode = DOMAIN_TO_SERVICE[courrier.domaine] || null;

    let serviceId: string | null = null;
    let serviceName: string | null = null;
    if (serviceCode) {
      const service = await this.serviceModel.findOne({ code: serviceCode }).exec();
      if (service) {
        serviceId = service._id.toString();
        serviceName = service.name;
      }
    }

    const priorite = this.inferPriority(`${courrier.objet || ''} ${text}`);

    const similarCount = await this.courrierModel.countDocuments({
      _id: { $ne: courrierId },
      statut: CourrierStatut.TRAITE,
      $or: [
        { domaine: courrier.domaine },
        { categorie: courrier.categorie },
      ],
    }).exec();

    return {
      resume,
      serviceId,
      serviceCode,
      serviceName,
      priorite,
      similarCount,
      source: 'heuristique',
    };
  }

  // Slow Ollama-enriched recommendation (used when user clicks "Ré-analyser avec Ollama").
  async recommendWithOllama(courrierId: string): Promise<RecommendationResult> {
    const courrier = await this.courrierModel.findById(courrierId).exec();
    if (!courrier) {
      throw new Error('Courrier introuvable');
    }

    const text = (courrier.contenu || '').trim() || courrier.objet || '';

    // Heuristic baseline, always available.
    let resume = this.summarizationService.summarize(text, courrier.objet, 3);
    let serviceCode = DOMAIN_TO_SERVICE[courrier.domaine] || null;
    let source: 'ollama' | 'heuristique' = 'heuristique';

    // Enrich with Ollama when reachable; otherwise the heuristic values stand.
    const llm = await this.ollamaService.analyzeCourrier(`${courrier.objet || ''}\n${text}`);
    if (llm) {
      if (llm.resume) resume = llm.resume;
      if (llm.serviceCode && VALID_SERVICE_CODES.includes(llm.serviceCode)) {
        serviceCode = llm.serviceCode;
      }
      source = 'ollama';
    }

    let serviceId: string | null = null;
    let serviceName: string | null = null;
    if (serviceCode) {
      const service = await this.serviceModel.findOne({ code: serviceCode }).exec();
      if (service) {
        serviceId = service._id.toString();
        serviceName = service.name;
      }
    }

    const priorite = this.inferPriority(`${courrier.objet || ''} ${text}`);

    const similarCount = await this.courrierModel.countDocuments({
      _id: { $ne: courrierId },
      statut: CourrierStatut.TRAITE,
      $or: [
        { domaine: courrier.domaine },
        { categorie: courrier.categorie },
      ],
    }).exec();

    return {
      resume,
      serviceId,
      serviceCode,
      serviceName,
      priorite,
      similarCount,
      source,
    };
  }

  private inferPriority(text: string): CourrierPriorite {
    const lower = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const highSignals = [
      'urgent', 'urgence', 'critique', 'immediat', 'sans delai', 'dans les plus brefs delais',
      'au plus vite', 'rapidement', 'relance', 'delai depasse', 'mise en demeure', 'penalite',
      'panne', 'hors service', 'interruption', 'paralyse', 'bloque', 'arret', 'indisponibilite',
      'pertes financieres', 'prejudice', 'reclamation', 'litige', 'saisir', 'recours', 'plainte',
      'depecher', 'intervention en urgence', 'majeure', 'grande ampleur',
    ];
    const lowSignals = [
      'pour information', 'a titre informatif', 'note interne', 'simple demande',
      'aucune urgence', 'quand vous pourrez', 'a votre convenance',
    ];

    const highHits = highSignals.filter((k) => lower.includes(k)).length;
    if (highHits >= 1) return CourrierPriorite.HAUTE;
    if (lowSignals.some((k) => lower.includes(k))) return CourrierPriorite.BASSE;
    return CourrierPriorite.MOYENNE;
  }
}
