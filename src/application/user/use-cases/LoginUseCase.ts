import bcrypt from 'bcryptjs';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IJwtService } from '@domain/user/services/IJwtService';
import { UnauthorizedError, ForbiddenError } from '@domain/shared/errors';

// Precomputed bcrypt hash (cost 12) — ensures constant-time response when user not found,
// preventing timing-based email enumeration attacks.
const DUMMY_HASH = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface LoginInput {
  email: string;
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

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email);

    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(input.password, hashToCompare);

    if (!user || !user.passwordHash || !passwordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (user.isPendingActivation()) {
      throw new ForbiddenError('Tu cuenta aún no ha sido activada. Revisa tu email.');
    }

    if (user.isPaused()) {
      throw new ForbiddenError('Tu cuenta está pausada.');
    }

    const refreshToken = this.jwtService.generateRefreshToken();
    const hash = this.jwtService.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
    await this.userRepo.updateRefreshTokenHash(user.id, hash, expiresAt);

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
