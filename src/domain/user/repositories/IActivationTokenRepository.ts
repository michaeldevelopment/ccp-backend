export interface ActivationTokenRecord {
  id: string;
  userId: string;
  token: string;
  usedAt: Date | null;
  user: { email: string };
}

export interface IActivationTokenRepository {
  findByToken(token: string): Promise<ActivationTokenRecord | null>;
  markAsUsed(id: string): Promise<void>;
  create(data: { userId: string; token: string }): Promise<void>;
}
