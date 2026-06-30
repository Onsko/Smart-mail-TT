import { IsString, IsOptional, IsBoolean, IsArray, IsMongoId } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  agents?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
