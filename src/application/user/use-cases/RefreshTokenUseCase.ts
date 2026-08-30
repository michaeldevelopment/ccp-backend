import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IJwtService } from '@domain/user/services/IJwtService';
import { UnauthorizedError, ForbiddenError } from '@domain/shared/errors';

interface RefreshTokenInput {
  refreshToken: string;
}

interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    const hash = this.jwtService.hashRefreshToken(input.refreshToken);
    const result = await this.userRepo.findByRefreshTokenHash(hash);

    if (!result) {
      throw new UnauthorizedError('Refresh token inválido');
    }

    const { user, refreshTokenExpiresAt } = result;

    if (refreshTokenExpiresAt && refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedError('El refresh token ha expirado');
    }

    if (!user.canLogin()) {
      throw new ForbiddenError('Tu cuenta está pausada.');
    }

    const newRefreshToken = this.jwtService.generateRefreshToken();
    const newHash = this.jwtService.hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
    await this.userRepo.updateRefreshTokenHash(user.id, newHash, newExpiresAt);

    const accessToken = this.jwtService.signAccessToken({ sub: user.id, role: user.role });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
