export interface IEmailService {
  sendPasswordResetEmail(to: string, resetLink: string): Promise<void>;
  sendActivationEmail(to: string, activationLink: string): Promise<void>;
  sendNewClassEmail(to: string, classTitle: string, moduleNumber: number): Promise<void>;
}
