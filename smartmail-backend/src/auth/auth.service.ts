import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { Role } from '../users/schemas/user.schema';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.actif) {
      throw new UnauthorizedException('Compte désactivé — contactez l\'administrateur');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        service: user.service,
        actif: user.actif,
      },
    };
  }

  async registerClient(dto: RegisterClientDto) {
    await this.usersService.create({
      ...dto,
      email: dto.email.toLowerCase(),
      role: Role.CLIENT,
    } as CreateUserDto);

    return this.login({ email: dto.email, password: dto.password });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('Aucun compte associé à cet email');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.setResetCode(dto.email, code, expiresAt);
    await this.mailService.sendPasswordResetCode(user.email, code);

    return { message: 'Un code de vérification a été envoyé à votre adresse email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('Aucun compte associé à cet email');
    if (!user.resetCode || user.resetCode !== dto.code) {
      throw new UnauthorizedException('Code invalide');
    }
    if (!user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      throw new UnauthorizedException('Code expiré');
    }

    await this.usersService.updatePassword(dto.email, dto.newPassword);
    return { message: 'Mot de passe mis à jour avec succès' };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user;
  }
}
