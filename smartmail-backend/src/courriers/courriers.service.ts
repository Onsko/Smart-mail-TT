import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Courrier, CourrierDocument, CourrierStatut, CourrierType } from './schemas/courrier.schema';
import { CreateCourrierDto } from './dto/create-courrier.dto';
import { AssignCourrierDto } from './dto/assign-courrier.dto';
import { ValidateCourrierDto } from './dto/validate-courrier.dto';
import { ReferenceService } from './services/reference.service';
import { OcrService, ExtractionResult } from './services/ocr.service';
import { RecommendationService, RecommendationResult } from './services/recommendation.service';

@Injectable()
export class CourriersService {
  constructor(
    @InjectModel(Courrier.name) private courrierModel: Model<CourrierDocument>,
    private referenceService: ReferenceService,
    private ocrService: OcrService,
    private recommendationService: RecommendationService,
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
