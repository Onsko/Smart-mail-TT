import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterClientDto {
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
}
