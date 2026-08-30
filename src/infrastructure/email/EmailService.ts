import sgMail from '@sendgrid/mail';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { IEmailService } from '@domain/shared/services/IEmailService';

export type { IEmailService };

sgMail.setApiKey(env.SENDGRID_API_KEY);

export class EmailService implements IEmailService {
  async sendActivationEmail(to: string, activationLink: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de activación', to, activationLink });
      return;
    }
    try {
      await sgMail.send({
        to,
        from: env.SENDGRID_FROM_EMAIL,
        subject: 'Activa tu cuenta — CCP',
        html: `
          <p>Hola,</p>
          <p>Tu cuenta en la plataforma CCP ha sido creada.</p>
          <p><a href="${activationLink}">Haz clic aquí para activar tu cuenta</a></p>
          <p>Si no esperabas este email, puedes ignorarlo.</p>
        `,
      });
    } catch (err) {
      logger.error({ message: 'Error al enviar email de activación', error: err, to });
    }
  }

  async sendNewClassEmail(to: string, classTitle: string, moduleNumber: number): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de nueva clase', to, classTitle, moduleNumber });
      return;
    }
    try {
      await sgMail.send({
        to,
        from: env.SENDGRID_FROM_EMAIL,
        subject: `Nueva clase disponible — Módulo ${moduleNumber}`,
        html: `
          <p>Hola,</p>
          <p>Hay una nueva clase disponible en el Módulo ${moduleNumber}: <strong>${classTitle}</strong>.</p>
          <p>Ingresa a la plataforma para verla.</p>
        `,
      });
    } catch (err) {
      logger.error({ message: 'Error al enviar email de nueva clase', error: err, to });
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de recuperación de contraseña', to, resetLink });
      return;
    }
    try {
      await sgMail.send({
        to,
        from: env.SENDGRID_FROM_EMAIL,
        subject: 'Recuperación de contraseña — CCP',
        html: `
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p><a href="${resetLink}">Haz clic aquí para restablecer tu contraseña</a></p>
          <p>Este enlace expira en 12 horas. Si no solicitaste esto, ignora este mensaje.</p>
        `,
      });
    } catch (err) {
      logger.error({ message: 'Error al enviar email de recuperación', error: err, to });
    }
  }
}
