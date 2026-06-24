import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le code est requis' })
  code: string;

  @IsString()
  @MinLength(6, { message: 'Mot de passe minimum 6 caractères' })
  newPassword: string;
}
