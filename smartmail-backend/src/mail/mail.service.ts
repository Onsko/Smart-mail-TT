import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP non configuré : les codes de réinitialisation seront affichés dans la console.');
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = 'Réinitialisation de votre mot de passe Smart Mail';
    const text = `Bonjour,\n\nVotre code de vérification est : ${code}\n\nIl est valable 15 minutes.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez ce message.\n\nSmart Mail`;
    const html = `<p>Bonjour,</p><p>Votre code de vérification est : <strong>${code}</strong></p><p>Il est valable 15 minutes.</p><p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p><p>Smart Mail</p>`;

    if (!this.transporter) {
      this.logger.log(`[DEV] Code de réinitialisation pour ${email} : ${code}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER'),
        to: email,
        subject,
        text,
        html,
      });
    } catch (err) {
      this.logger.warn(`Envoi email échoué (${(err as Error).message}).`);
      this.logger.log(`[DEV] Code de réinitialisation pour ${email} : ${code}`);
    }
  }
}
