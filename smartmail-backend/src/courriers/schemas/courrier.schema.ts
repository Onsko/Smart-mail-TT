import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourrierDocument = Courrier & Document;

export enum CourrierType {
  ENTRANT = 'ENTRANT',
  SORTANT = 'SORTANT',
}

export enum CourrierCategorie {
  RECLAMATION = 'RECLAMATION',
  DEMANDE = 'DEMANDE',
  FACTURE = 'FACTURE',
  INFORMATION = 'INFORMATION',
  AUTRE = 'AUTRE',
}

export enum CourrierDomaine {
  TECHNIQUE = 'TECHNIQUE',
  RH = 'RH',
  FINANCE = 'FINANCE',
  COMMERCIAL = 'COMMERCIAL',
  AUTRE = 'AUTRE',
}

export enum CourrierPriorite {
  HAUTE = 'HAUTE',
  MOYENNE = 'MOYENNE',
  BASSE = 'BASSE',
}

export enum CourrierStatut {
  NOUVEAU = 'NOUVEAU',
  A_AFFECTER = 'A_AFFECTER',
  A_TRAITER = 'A_TRAITER',
  EN_COURS = 'EN_COURS',
  TRAITE = 'TRAITE',
  REJETE = 'REJETE',
  EN_ATTENTE = 'EN_ATTENTE',
  CLOTURE = 'CLOTURE',
}

@Schema({ timestamps: true })
export class Courrier {
  @Prop({ required: true, unique: true, index: true })
  reference: string;

  @Prop({ type: String, enum: CourrierType, required: true })
  type: CourrierType;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: Number, default: 1 })
  nombrePieces: number;

  @Prop({ default: '' })
  correspondant: string;

  @Prop({ default: '' })
  emailClient: string;

  @Prop({ required: true })
  objet: string;

  @Prop({ default: '' })
  contenu: string;

  @Prop({ default: '' })
  observation: string;

  @Prop({ type: String, enum: CourrierCategorie, default: CourrierCategorie.AUTRE })
  categorie: CourrierCategorie;

  @Prop({ type: String, enum: CourrierDomaine, default: CourrierDomaine.AUTRE })
  domaine: CourrierDomaine;

  @Prop({ type: String, enum: CourrierPriorite, default: CourrierPriorite.MOYENNE })
  priorite: CourrierPriorite;

  @Prop({ type: String, enum: CourrierStatut, default: CourrierStatut.NOUVEAU })
  statut: CourrierStatut;

  @Prop({ type: [String], default: [] })
  documents: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', default: null })
  service: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  agentAssigne: Types.ObjectId;

  @Prop({ default: '' })
  resumeIA: string;

  @Prop({ default: '' })
  reponse: string;

  @Prop({ default: false })
  reponseEnvoyee: boolean;

  @Prop({ type: Object, default: null })
  extractionsIA: Record<string, unknown> | null;

  @Prop({ type: [{ action: String, date: Date, user: Types.ObjectId }], default: [] })
  historique: { action: string; date: Date; user: Types.ObjectId }[];
}

export const CourrierSchema = SchemaFactory.createForClass(Courrier);
