export interface IEmailService {
  sendActivationEmail(to: string, activationLink: string, name?: string): Promise<void>;
  sendNewClassEmail(
    to: string,
    classTitle: string,
    moduleNumber: number,
    name?: string
  ): Promise<void>;
  sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<void>;
}
