import { IsString, IsOptional, IsBoolean, IsArray, IsMongoId } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

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
