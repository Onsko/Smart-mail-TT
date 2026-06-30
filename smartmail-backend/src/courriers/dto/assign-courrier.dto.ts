import { IsMongoId, IsOptional } from 'class-validator';

export class AssignCourrierDto {
  @IsMongoId()
  service: string;

  @IsOptional()
  @IsMongoId()
  agentAssigne?: string;
}
