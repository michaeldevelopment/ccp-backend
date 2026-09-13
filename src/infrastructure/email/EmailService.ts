import sgMail from '@sendgrid/mail';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { IEmailService } from '@domain/shared/services/IEmailService';

export type { IEmailService };

sgMail.setApiKey(env.SENDGRID_API_KEY);

export class EmailService implements IEmailService {
  async sendActivationEmail(to: string, activationLink: string, name?: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de activación', to, activationLink, name });
    }
    try {
      await sgMail.send({
        to,
        from: env.SENDGRID_FROM_EMAIL,
        templateId: env.SENDGRID_TEMPLATE_ID,
        dynamicTemplateData: { subject: 'Activa tu cuenta — CCP', name, activationLink },
      });
    } catch (err) {
      logger.error({ message: 'Error al enviar email de activación', error: err, to });
    }
  }

  async sendNewClassEmail(
    to: string,
    classTitle: string,
    moduleNumber: number,
    name?: string
  ): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de nueva clase', to, classTitle, moduleNumber, name });
    }
    try {
      await sgMail.send({
        to,
        from: env.SENDGRID_FROM_EMAIL,
        templateId: env.SENDGRID_TEMPLATE_ID,
        dynamicTemplateData: {
          subject: `Nueva clase disponible — Módulo ${moduleNumber}`,
          name,
          classTitle,
          moduleNumber,
        },
      });
    } catch (err) {
      logger.error({ message: 'Error al enviar email de nueva clase', error: err, to });
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de recuperación de contraseña', to, resetLink, name });
    }
    try {
      await sgMail.send({
        to,
        from: env.SENDGRID_FROM_EMAIL,
        templateId: env.SENDGRID_TEMPLATE_ID,
        dynamicTemplateData: { subject: 'Recuperación de contraseña — CCP', name, resetLink },
      });
    } catch (err) {
      logger.error({ message: 'Error al enviar email de recuperación', error: err, to });
    }
  }
}
