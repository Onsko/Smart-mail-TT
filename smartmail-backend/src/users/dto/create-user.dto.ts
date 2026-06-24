import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  prenom: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mot de passe minimum 6 caractères' })
  password: string;

  @IsEnum(Role, { message: 'Rôle invalide' })
  role: Role;

  @IsOptional()
  @IsString()
  service?: string;
}
