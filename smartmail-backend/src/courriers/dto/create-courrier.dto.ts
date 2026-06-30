import { IsString, IsEnum, IsOptional, IsDateString, IsArray, IsInt, Min, IsMongoId } from 'class-validator';
import {
  CourrierType,
  CourrierCategorie,
  CourrierDomaine,
  CourrierPriorite,
  CourrierStatut,
} from '../schemas/courrier.schema';

export class CreateCourrierDto {
  @IsEnum(CourrierType)
  type: CourrierType;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  nombrePieces?: number;

  @IsOptional()
  @IsString()
  correspondant?: string;

  @IsString()
  objet: string;

  @IsOptional()
  @IsString()
  contenu?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsEnum(CourrierCategorie)
  categorie?: CourrierCategorie;

  @IsOptional()
  @IsEnum(CourrierDomaine)
  domaine?: CourrierDomaine;

  @IsOptional()
  @IsEnum(CourrierPriorite)
  priorite?: CourrierPriorite;

  @IsOptional()
  @IsEnum(CourrierStatut)
  statut?: CourrierStatut;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsMongoId()
  service?: string;

  @IsOptional()
  @IsMongoId()
  agentAssigne?: string;

  @IsOptional()
  @IsString()
  resumeIA?: string;
}
