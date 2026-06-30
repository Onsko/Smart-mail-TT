import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

const DEFAULT_SERVICES = [
  { code: 'TECHNIQUE', name: 'Service Technique', description: 'Raccordement, fibre, pannes, infrastructure' },
  { code: 'RH', name: 'Ressources Humaines', description: 'Personnel, congés, recrutement, santé au travail' },
  { code: 'FINANCE', name: 'Service Finance', description: 'Factures, paiements, budget, comptabilité' },
  { code: 'COMMERCIAL', name: 'Service Commercial', description: 'Offres, clients, ventes, abonnements, contrats' },
];

@Injectable()
export class ServicesService implements OnModuleInit {
  constructor(@InjectModel(Service.name) private serviceModel: Model<ServiceDocument>) {}

  async onModuleInit() {
    for (const svc of DEFAULT_SERVICES) {
      await this.serviceModel.updateOne(
        { code: svc.code },
        { $setOnInsert: { ...svc, agents: [] } },
        { upsert: true },
      );
    }
    // Remove services no longer part of the catalog (e.g. the former JURIDIQUE).
    const validCodes = DEFAULT_SERVICES.map((s) => s.code);
    await this.serviceModel.deleteMany({ code: { $nin: validCodes } }).exec();
  }

  async create(dto: CreateServiceDto): Promise<ServiceDocument> {
    const created = new this.serviceModel({
      ...dto,
      agents: (dto.agents || []).map((id) => new Types.ObjectId(id)),
    });
    return created.save();
  }

  async findAll(): Promise<ServiceDocument[]> {
    return this.serviceModel.find().populate('agents', 'name email').exec();
  }

  async findById(id: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findById(id).populate('agents', 'name email').exec();
  }

  async findByCode(code: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findOne({ code }).exec();
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceDocument | null> {
    const update: any = { ...dto };
    if (dto.agents) {
      update.agents = dto.agents.map((id) => new Types.ObjectId(id));
    }
    return this.serviceModel.findByIdAndUpdate(id, update, { new: true }).populate('agents', 'name email').exec();
  }

  async delete(id: string): Promise<void> {
    await this.serviceModel.findByIdAndDelete(id).exec();
  }
}
