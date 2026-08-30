import bcrypt from 'bcryptjs';
import { IActivationTokenRepository } from '@domain/user/repositories/IActivationTokenRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IJwtService } from '@domain/user/services/IJwtService';
import { NotFoundError, GoneError } from '@domain/shared/errors';

interface ActivateAccountInput {
  token: string;
  name: string;
  password: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    groupId: string | null;
    entryModule: number | null;
  };
}

export class ActivateAccountUseCase {
  constructor(
    private readonly activationTokenRepo: IActivationTokenRepository,
    private readonly userRepo: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  async execute(input: ActivateAccountInput): Promise<AuthResult> {
    const record = await this.activationTokenRepo.findByToken(input.token);

    if (!record) {
      throw new NotFoundError('Token de activación no encontrado');
    }

    if (record.usedAt !== null) {
      throw new GoneError('Token de activación ya fue utilizado');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const refreshToken = this.jwtService.generateRefreshToken();
    const refreshTokenHash = this.jwtService.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const user = await this.userRepo.activateUserComplete(record.userId, record.id, {
      name: input.name,
      passwordHash,
      refreshTokenHash,
      refreshTokenExpiresAt,
    });

    const accessToken = this.jwtService.signAccessToken({ sub: user.id, role: user.role });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        groupId: user.groupId,
        entryModule: user.entryModule,
      },
    };
  }
}
