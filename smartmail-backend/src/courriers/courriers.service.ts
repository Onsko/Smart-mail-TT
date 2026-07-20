import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Courrier, CourrierDocument, CourrierStatut, CourrierType } from './schemas/courrier.schema';
import { CreateCourrierDto } from './dto/create-courrier.dto';
import { AssignCourrierDto } from './dto/assign-courrier.dto';
import { ValidateCourrierDto } from './dto/validate-courrier.dto';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ReferenceService } from './services/reference.service';
import { OcrService, ExtractionResult } from './services/ocr.service';
import { RecommendationService, RecommendationResult } from './services/recommendation.service';
import { OllamaService } from './services/ollama.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../users/schemas/user.schema';

export interface OllamaExtractionResult extends ExtractionResult {
  resume: string;
  serviceCode: string | null;
  serviceName: string | null;
  serviceId: string | null;
  source: 'ollama' | 'heuristique';
}

@Injectable()
export class CourriersService {
  private readonly logger = new Logger(CourriersService.name);

  constructor(
    @InjectModel(Courrier.name) private courrierModel: Model<CourrierDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private referenceService: ReferenceService,
    private ocrService: OcrService,
    private recommendationService: RecommendationService,
    private ollamaService: OllamaService,
    private notificationsService: NotificationsService,
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

  async reformulerTexte(text: string): Promise<{ result: string | null }> {
    const result = await this.ollamaService.reformuler(text);
    if (!result) throw new BadRequestException('Ollama indisponible ou erreur lors de la reformulation');
    return { result };
  }

  async resumerTexte(text: string): Promise<{ result: string | null }> {
    const result = await this.ollamaService.resumer(text);
    if (!result) throw new BadRequestException('Ollama indisponible ou erreur lors du résumé');
    return { result };
  }

  async genererReponseIA(objet: string, contenu: string): Promise<{ result: string | null; error?: string }> {
    try {
      // Vérifier d'abord si Ollama est disponible
      const isAvailable = await this.ollamaService.isAvailable();
      if (!isAvailable) {
        return { 
          result: null, 
          error: 'Service IA temporairement indisponible. Veuillez réessayer plus tard.' 
        };
      }

      const result = await this.ollamaService.genererReponse(objet, contenu);
      if (!result) {
        return { 
          result: null, 
          error: 'Impossible de générer une réponse. Veuillez vérifier votre saisie.' 
        };
      }
      
      return { result };
    } catch (error) {
      this.logger.warn(`Erreur génération réponse IA: ${error.message}`);
      return { 
        result: null, 
        error: 'Service IA temporairement indisponible. Veuillez réessayer plus tard.' 
      };
    }
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

  // Suivi public par référence (pour les clients)
  async findByReference(reference: string): Promise<any> {
    const courrier = await this.courrierModel
      .findOne({ reference: reference.toUpperCase() })
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom')
      .lean()
      .exec();
    if (!courrier) {
      throw new NotFoundException('Courrier introuvable avec cette référence');
    }
    return {
      _id: courrier._id.toString(),
      reference: courrier.reference,
      objet: courrier.objet,
      statut: courrier.statut,
      priorite: courrier.priorite,
      correspondant: courrier.correspondant,
      createdAt: (courrier as any).createdAt,
      reponse: (courrier as any).reponse || '',
      reponseEnvoyee: (courrier as any).reponseEnvoyee || false,
      service: courrier.service ? {
        _id: (courrier.service as any)._id?.toString(),
        name: (courrier.service as any).name,
        code: (courrier.service as any).code,
      } : null,
      agentAssigne: courrier.agentAssigne ? {
        _id: (courrier.agentAssigne as any)._id?.toString(),
        nom: (courrier.agentAssigne as any).nom,
        prenom: (courrier.agentAssigne as any).prenom,
      } : null,
      historique: (courrier.historique || []).map((h: any) => ({
        action: h.action,
        date: h.date,
      })),
    };
  }

  async getRecommendations(courrierId: string): Promise<RecommendationResult> {
    return this.recommendationService.recommend(courrierId);
  }

  // --- Chef de service ---

  // Récupère les courriers affectés au service du chef connecté.
  async findForChef(userId: string): Promise<CourrierDocument[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.service) {
      throw new NotFoundException('Aucun service associé à cet utilisateur');
    }
    return this.courrierModel
      .find({ service: user.service })
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom email')
      .populate('createdBy', 'nom prenom')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Récupère les courriers assignés à l'agent connecté.
  async findForAgent(userId: string): Promise<CourrierDocument[]> {
    return this.courrierModel
      .find({ agentAssigne: new Types.ObjectId(userId) })
      .populate('service', 'code name')
      .populate('agentAssigne', 'nom prenom email')
      .populate('createdBy', 'nom prenom')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Récupère les agents du service du chef + leur charge (nombre de courriers actifs).
  async getAgentsCharge(userId: string): Promise<{
    serviceId: string;
    serviceName: string;
    agents: {
      _id: string;
      nom: string;
      prenom: string;
      email: string;
      charge: number;
      recommended: boolean;
    }[];
  }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.service) {
      throw new NotFoundException('Aucun service associé à cet utilisateur');
    }
    const service = await this.serviceModel.findById(user.service).exec();
    if (!service) {
      throw new NotFoundException('Service introuvable');
    }

    // Cherche directement les utilisateurs AGENT liés à ce service
    const agents = await this.userModel
      .find({ service: user.service, role: Role.AGENT, actif: true })
      .select('nom prenom email')
      .exec();

    // Compte les courriers actifs (A_TRAITER, EN_COURS) par agent.
    const charges = await Promise.all(
      agents.map(async (agent) => {
        const count = await this.courrierModel.countDocuments({
          agentAssigne: agent._id,
          statut: { $in: [CourrierStatut.A_TRAITER, CourrierStatut.EN_COURS] },
        }).exec();
        return {
          _id: agent._id.toString(),
          nom: agent.nom,
          prenom: agent.prenom,
          email: agent.email,
          charge: count,
        };
      }),
    );

    // L'agent avec le moins de courriers est recommandé.
    const minCharge = charges.length > 0 ? Math.min(...charges.map((a) => a.charge)) : 0;
    const result = charges.map((a) => ({
      _id: a._id.toString(),
      nom: a.nom,
      prenom: a.prenom,
      email: a.email,
      charge: a.charge,
      recommended: a.charge === minCharge,
    }));

    return {
      serviceId: service._id.toString(),
      serviceName: service.name,
      agents: result,
    };
  }

  // Assigne un courrier à un agent spécifique (par le chef de service).
  async assignAgent(courrierId: string, agentId: string, userId: string): Promise<CourrierDocument> {
    const courrier = await this.courrierModel
      .findByIdAndUpdate(
        courrierId,
        {
          agentAssigne: new Types.ObjectId(agentId),
          statut: CourrierStatut.EN_COURS,
          $push: {
            historique: {
              action: `Affectation à l'agent ${agentId}`,
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

    // Notifier l'agent assigné
    await this.notificationsService.createForUser(
      agentId,
      `Courrier ${courrier.reference} vous a été assigné : ${courrier.objet}`,
      'COURRIER_AGENT',
      courrierId,
    );

    return courrier;
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

    // Notify all CHEF users of the assigned service.
    const chefs = await this.userModel
      .find({ service: new Types.ObjectId(dto.service), role: Role.CHEF, actif: true })
      .select('_id')
      .exec();
    if (chefs.length > 0) {
      const serviceName = (courrier.service as any)?.name || dto.service;
      await this.notificationsService.createForUsers(
        chefs.map((c) => c._id.toString()),
        `Nouveau courrier affecté au service ${serviceName} : ${courrier.objet}`,
        'COURRIER_AFFECTE',
        courrierId,
      );
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

  async updateStatut(courrierId: string, statut: string, userId: string): Promise<CourrierDocument> {
    const validStatuts = ['NOUVEAU', 'A_AFFECTER', 'A_TRAITER', 'EN_COURS', 'TRAITE', 'CLOTURE'];
    if (!validStatuts.includes(statut)) {
      throw new BadRequestException(`Statut invalide: ${statut}`);
    }
    const courrier = await this.courrierModel
      .findByIdAndUpdate(
        courrierId,
        {
          statut,
          $push: {
            historique: {
              action: `Statut changé à ${statut}`,
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

  async saveReponse(courrierId: string, reponse: string, envoyer: boolean, userId: string): Promise<CourrierDocument> {
    const update: any = {
      reponse,
      reponseEnvoyee: envoyer,
    };
    if (envoyer) {
      update.statut = 'TRAITE';
    }
    const courrier = await this.courrierModel
      .findByIdAndUpdate(
        courrierId,
        {
          ...update,
          $push: {
            historique: {
              action: envoyer ? 'Réponse envoyée par l\'agent' : 'Brouillon enregistré par l\'agent',
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
