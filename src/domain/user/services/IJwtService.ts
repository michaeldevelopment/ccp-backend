export interface AccessTokenPayload {
  sub: string;
  role: string;
  type: 'access';
}

export interface IJwtService {
  signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
}
