import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Courrier, CourrierDocument, CourrierStatut, CourrierType } from './schemas/courrier.schema';
import { CreateCourrierDto } from './dto/create-courrier.dto';
import { AssignCourrierDto } from './dto/assign-courrier.dto';
import { ValidateCourrierDto } from './dto/validate-courrier.dto';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { ReferenceService } from './services/reference.service';
import { OcrService, ExtractionResult } from './services/ocr.service';
import { RecommendationService, RecommendationResult } from './services/recommendation.service';
import { OllamaService } from './services/ollama.service';

export interface OllamaExtractionResult extends ExtractionResult {
  resume: string;
  serviceCode: string | null;
  serviceName: string | null;
  serviceId: string | null;
  source: 'ollama' | 'heuristique';
}

@Injectable()
export class CourriersService {
  constructor(
    @InjectModel(Courrier.name) private courrierModel: Model<CourrierDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    private referenceService: ReferenceService,
    private ocrService: OcrService,
    private recommendationService: RecommendationService,
    private ollamaService: OllamaService,
  ) {}

  async create(dto: CreateCourrierDto, createdBy: string): Promise<CourrierDocument> {
    const reference = await this.referenceService.generateNext();
    const created = new this.courrierModel({
      ...dto,
      reference,
      createdBy: new Types.ObjectId(createdBy),
      service: dto.service ? new Types.ObjectId(dto.service) : null,
      agentAssigne: dto.agentAssigne ? new Types.ObjectId(dto.agentAssigne) : null,
      historique: [
        {
          action: 'Création du courrier',
          date: new Date(),
          user: new Types.ObjectId(createdBy),
        },
      ],
    });
    return created.save();
  }

  async findAll(): Promise<CourrierDocument[]> {
    return this.courrierModel.find()
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom email')
      .populate('createdBy', 'nom prenom')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<CourrierDocument> {
    const courrier = await this.courrierModel
      .findById(id)
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom email')
      .populate('createdBy', 'nom prenom')
      .exec();
    if (!courrier) {
      throw new NotFoundException('Courrier introuvable');
    }
    return courrier;
  }

  async extractFromDocument(filePath: string, mimeType: string): Promise<ExtractionResult> {
    return this.ocrService.extractFromDocument(filePath, mimeType);
  }

  async getOllamaStatus(): Promise<{ available: boolean; model: string }> {
    return {
      available: await this.ollamaService.isAvailable(),
      model: this.ollamaService.getModelName(),
    };
  }

  // Hybrid analysis: always compute the reliable heuristic baseline, then enrich
  // with Ollama when available. Heuristic values fill any gap left by the LLM,
  // so the result is never worse than the heuristic-only extraction.
  async analyzeWithOllama(filePath: string, mimeType: string): Promise<OllamaExtractionResult> {
    const rawText = await this.ocrService.extractRawText(filePath, mimeType);
    const heuristic = this.ocrService.analyze(rawText);

    const llm = await this.ollamaService.analyzeCourrier(rawText);

    const merged: ExtractionResult = {
      correspondant: llm?.correspondant || heuristic.correspondant,
      objet: llm?.objet || heuristic.objet,
      contenu: llm?.contenu || heuristic.contenu,
      categorie: llm?.categorie || heuristic.categorie,
      domaine: llm?.domaine || heuristic.domaine,
      priorite: llm?.priorite || heuristic.priorite,
      date: llm?.date || heuristic.date,
      lieu: llm?.lieu || heuristic.lieu,
    };

    // Resolve the target service: prefer the LLM suggestion, fall back to the
    // domaine-derived code so an existing service is always proposed.
    const serviceCode = llm?.serviceCode || this.domaineToServiceCode(merged.domaine);
    const { serviceId, serviceName } = await this.resolveService(serviceCode);

    const resume = llm?.resume || '';

    return {
      ...merged,
      resume,
      serviceCode,
      serviceId,
      serviceName,
      source: llm ? 'ollama' : 'heuristique',
    };
  }

  private domaineToServiceCode(domaine: string): string | null {
    const map: Record<string, string> = {
      TECHNIQUE: 'TECHNIQUE',
      RH: 'RH',
      FINANCE: 'FINANCE',
      COMMERCIAL: 'COMMERCIAL',
    };
    return map[domaine] || null;
  }

  private async resolveService(code: string | null): Promise<{ serviceId: string | null; serviceName: string | null }> {
    if (!code) return { serviceId: null, serviceName: null };
    const service = await this.serviceModel.findOne({ code }).exec();
    if (!service) return { serviceId: null, serviceName: null };
    return { serviceId: service._id.toString(), serviceName: service.name };
  }

  // Re-analyze an existing courrier with Ollama (used by the directeur page).
  // Returns the same shape as getRecommendations but forces an Ollama call.
  async reanalyserAvecOllama(courrierId: string): Promise<RecommendationResult> {
    return this.recommendationService.recommendWithOllama(courrierId);
  }

  async storeExtraction(courrierId: string, extraction: ExtractionResult): Promise<CourrierDocument> {
    const courrier = await this.courrierModel.findByIdAndUpdate(
      courrierId,
      {
        extractionsIA: extraction,
        $push: {
          historique: {
            action: 'Extraction IA du document',
            date: new Date(),
            user: null,
          },
        },
      },
      { new: true },
    ).exec();
    if (!courrier) {
      throw new NotFoundException('Courrier introuvable');
    }
    return courrier;
  }

  async attachDocument(courrierId: string, url: string): Promise<CourrierDocument> {
    const courrier = await this.courrierModel.findByIdAndUpdate(
      courrierId,
      { $push: { documents: url } },
      { new: true },
    ).exec();
    if (!courrier) {
      throw new NotFoundException('Courrier introuvable');
    }
    return courrier;
  }

  async findPendingForDirector(): Promise<CourrierDocument[]> {
    return this.courrierModel
      .find({
        type: CourrierType.ENTRANT,
        statut: { $in: [CourrierStatut.NOUVEAU, CourrierStatut.A_AFFECTER] },
      })
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom email')
      .populate('createdBy', 'nom prenom')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getRecommendations(courrierId: string): Promise<RecommendationResult> {
    return this.recommendationService.recommend(courrierId);
  }

  async assignService(courrierId: string, dto: AssignCourrierDto, userId: string): Promise<CourrierDocument> {
    const update: any = {
      service: new Types.ObjectId(dto.service),
      statut: 'A_TRAITER',
    };
    if (dto.agentAssigne) {
      update.agentAssigne = new Types.ObjectId(dto.agentAssigne);
    }
    const courrier = await this.courrierModel
      .findByIdAndUpdate(
        courrierId,
        {
          ...update,
          $push: {
            historique: {
              action: `Affectation au service ${dto.service}${dto.agentAssigne ? ' avec agent assigné' : ''}`,
              date: new Date(),
              user: new Types.ObjectId(userId),
            },
          },
        },
        { new: true },
      )
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom email')
      .exec();
    if (!courrier) {
      throw new NotFoundException('Courrier introuvable');
    }
    return courrier;
  }

  async validateDirector(courrierId: string, dto: ValidateCourrierDto, userId: string): Promise<CourrierDocument> {
    const update: any = { statut: 'A_TRAITER' };
    if (dto.priorite) {
      update.priorite = dto.priorite;
    }
    const courrier = await this.courrierModel
      .findByIdAndUpdate(
        courrierId,
        {
          ...update,
          $push: {
            historique: {
              action: 'Validation par le directeur',
              date: new Date(),
              user: new Types.ObjectId(userId),
            },
          },
        },
        { new: true },
      )
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom email')
      .exec();
    if (!courrier) {
      throw new NotFoundException('Courrier introuvable');
    }
    return courrier;
  }
}
