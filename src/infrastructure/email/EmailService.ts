import { Resend } from 'resend';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { IEmailService } from '@domain/shared/services/IEmailService';
import { renderEmail, EmailContent } from './emailTemplate';

export type { IEmailService };

const resend = new Resend(env.RESEND_API_KEY);
const FROM = `Only One Coaching · CCP <${env.EMAIL_FROM}>`;

export class EmailService implements IEmailService {
  // El SDK de Resend no lanza: devuelve { error }. Hay que revisarlo explícitamente.
  private async send(to: string, subject: string, content: EmailContent, name?: string) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject,
        html: renderEmail(content, name),
      });
      if (error) logger.error({ message: 'Resend rechazó el envío', error, to, subject });
    } catch (err) {
      logger.error({ message: 'Error al enviar email', error: err, to, subject });
    }
  }

  async sendActivationEmail(to: string, activationLink: string, name?: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de activación', to, activationLink, name });
    }
    await this.send(
      to,
      'Activa tu cuenta — CCP',
      {
        eyebrow: 'ACTIVACIÓN DE CUENTA - INSCRIPCIONES CAMPUS CCP',
        heading: '¡Bienvenido/a al Campus CCP!',
        intro:
          'Tu cuenta en la plataforma **Campus CCP** ha sido creada. Haz clic en el botón de abajo para activarla y comenzar tu proceso de crecimiento personal.',
        cta: { label: 'Activar mi cuenta →', url: activationLink },
        notice: [
          'Si no esperabas este email, puedes ignorarlo. Tu cuenta no será activada sin hacer clic en el enlace.',
        ],
      },
      name
    );
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
    await this.send(
      to,
      `Nueva clase disponible — Módulo ${moduleNumber}`,
      {
        eyebrow: 'NUEVA CLASE DISPONIBLE',
        heading: 'Tienes contenido nuevo',
        highlight: { badge: `MÓDULO ${moduleNumber}`, title: classTitle },
        outro: 'Ingresa a la plataforma para verla y continuar con tu proceso.',
      },
      name
    );
  }

  async sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      logger.info({ message: '[DEV] Email de recuperación de contraseña', to, resetLink, name });
    }
    await this.send(
      to,
      'Recuperación de contraseña — CCP',
      {
        eyebrow: 'SEGURIDAD DE CUENTA',
        heading: 'Restablecer contraseña',
        intro:
          'Recibimos una solicitud para restablecer la contraseña de tu cuenta en **Campus CCP**. Si fuiste tú, haz clic en el botón de abajo para continuar.',
        cta: { label: 'Restablecer contraseña →', url: resetLink },
        notice: [
          'Este enlace expira en **12 horas**.',
          'Si no solicitaste esto, puedes ignorar este mensaje. Tu contraseña no será modificada.',
        ],
      },
      name
    );
  }
}
