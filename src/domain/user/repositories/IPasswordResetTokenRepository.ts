export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface IPasswordResetTokenRepository {
  create(data: { userId: string; token: string; expiresAt: Date }): Promise<void>;
  findByToken(token: string): Promise<PasswordResetTokenRecord | null>;
  markAsUsed(id: string): Promise<void>;
}
