import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BO = 'BO',
  DIRECTEUR = 'DIRECTEUR',
  CHEF = 'CHEF',
  AGENT = 'AGENT',
  CLIENT = 'CLIENT',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'Service', default: null })
  service: Types.ObjectId;

  @Prop({ default: true })
  actif: boolean;

  @Prop({ type: String, default: null })
  resetCode: string | null;

  @Prop({ type: Date, default: null })
  resetCodeExpires: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
