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

  async sendCourrierNotification(email: string, reference: string, objet: string): Promise<void> {
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const subject = `SmartMail - Votre courrier N° ${reference} a été enregistré`;
    const text = [
      `Bonjour,`,
      ``,
      `Votre courrier "${objet}" a bien été enregistré sous la référence : ${reference}`,
      ``,
      `Pour suivre l'état de votre courrier : ${siteUrl}/suivi?ref=${reference}`,
      ``,
      `Créez votre compte sur notre site pour suivre tous vos courriers : ${siteUrl}/client/register`,
      ``,
      `Cordialement,`,
      `L'équipe Tunisie Telecom`,
    ].join('\n');
    const html = [
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">`,
      `  <h2 style="color: #004080;">Tunisie Telecom — SmartMail</h2>`,
      `  <p>Bonjour,</p>`,
      `  <p>Votre courrier <strong>"${objet}"</strong> a bien été enregistré.</p>`,
      `  <div style="background: #f0f4f8; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">`,
      `    <p style="margin: 0 0 4px; font-size: 13px; color: #666;">Numéro de référence</p>`,
      `    <p style="margin: 0; font-size: 22px; font-weight: bold; font-family: monospace; color: #004080;">${reference}</p>`,
      `  </div>`,
      `  <p>`,
      `    <a href="${siteUrl}/suivi?ref=${reference}" style="display: inline-block; background: #004080; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">`,
      `      Suivre l'état de mon courrier`,
      `    </a>`,
      `  </p>`,
      `  <p style="margin-top: 24px;">`,
      `    <a href="${siteUrl}/client/register" style="color: #004080;">Créer un compte</a>`,
      `    pour suivre tous vos courriers facilement.`,
      `  </p>`,
      `  <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />`,
      `  <p style="font-size: 12px; color: #999;">Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>`,
      `</div>`,
    ].join('\n');

    if (!this.transporter) {
      this.logger.log(`[DEV] Notification courrier pour ${email} : Ref ${reference}`);
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
      this.logger.log(`Email envoyé à ${email} pour le courrier ${reference}`);
    } catch (err) {
      this.logger.warn(`Envoi email courrier échoué (${(err as Error).message}).`);
      this.logger.log(`[DEV] Notification courrier pour ${email} : Ref ${reference}`);
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
