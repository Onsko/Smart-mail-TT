import { IsOptional, IsEnum } from 'class-validator';
import { CourrierPriorite } from '../schemas/courrier.schema';

export class ValidateCourrierDto {
  @IsOptional()
  @IsEnum(CourrierPriorite)
  priorite?: CourrierPriorite;
}
