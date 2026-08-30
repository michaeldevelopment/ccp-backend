import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IJwtService, AccessTokenPayload } from '@domain/user/services/IJwtService';
import { UnauthorizedError } from '@domain/shared/errors';
import { env } from '@config/env';

export class JwtService implements IJwtService {
  signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
    return jwt.sign({ sub: payload.sub, role: payload.role, type: 'access' }, env.JWT_SECRET, {
      expiresIn: '2h',
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
      if (decoded.type !== 'access') {
        throw new UnauthorizedError('Tipo de token inválido');
      }
      return decoded;
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Token inválido o expirado');
    }
  }

  generateRefreshToken(): string {
    return crypto.randomUUID();
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
