import { Request, Response } from 'express';
import { LoginUseCase } from '@application/user/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '@application/user/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '@application/user/use-cases/LogoutUseCase';
import { GetMeUseCase } from '@application/user/use-cases/GetMeUseCase';
import { ValidateActivationTokenUseCase } from '@application/user/use-cases/ValidateActivationTokenUseCase';
import { ActivateAccountUseCase } from '@application/user/use-cases/ActivateAccountUseCase';
import { RequestPasswordResetUseCase } from '@application/user/use-cases/RequestPasswordResetUseCase';
import { ConsumePasswordResetUseCase } from '@application/user/use-cases/ConsumePasswordResetUseCase';
import { ChangePasswordUseCase } from '@application/user/use-cases/ChangePasswordUseCase';
import { PrismaUserRepository } from '@infrastructure/persistence/prisma/PrismaUserRepository';
import { PrismaActivationTokenRepository } from '@infrastructure/persistence/prisma/PrismaActivationTokenRepository';
import { PrismaPasswordResetTokenRepository } from '@infrastructure/persistence/prisma/PrismaPasswordResetTokenRepository';
import { JwtService } from '@infrastructure/services/JwtService';
import { EmailService } from '@infrastructure/email/EmailService';
import {
  LoginDto,
  RefreshTokenDto,
  ActivateAccountDto,
  RequestPasswordResetDto,
  ConsumePasswordResetDto,
  ChangePasswordDto,
} from '@presentation/dtos/auth.dto';
import { ValidationError, UnauthorizedError } from '@domain/shared/errors';

const userRepo = new PrismaUserRepository();
const activationTokenRepo = new PrismaActivationTokenRepository();
const passwordResetTokenRepo = new PrismaPasswordResetTokenRepository();
const jwtService = new JwtService();
const emailService = new EmailService();

const loginUseCase = new LoginUseCase(userRepo, jwtService);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, jwtService);
const logoutUseCase = new LogoutUseCase(userRepo);
const getMeUseCase = new GetMeUseCase(userRepo);
const validateActivationTokenUseCase = new ValidateActivationTokenUseCase(activationTokenRepo);
const activateAccountUseCase = new ActivateAccountUseCase(
  activationTokenRepo,
  userRepo,
  jwtService
);
const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
  userRepo,
  passwordResetTokenRepo,
  emailService
);
const consumePasswordResetUseCase = new ConsumePasswordResetUseCase(
  userRepo,
  passwordResetTokenRepo
);
const changePasswordUseCase = new ChangePasswordUseCase(userRepo);

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const body = LoginDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await loginUseCase.execute(body.data);
    res.status(200).json(result);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const body = RefreshTokenDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Refresh token requerido', body.error.flatten());
    const result = await refreshTokenUseCase.execute(body.data);
    res.status(200).json(result);
  }

  async logout(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    await logoutUseCase.execute({ userId: req.user.id });
    res.status(204).send();
  }

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const result = await getMeUseCase.execute({ userId: req.user.id });
    res.status(200).json(result);
  }

  async validateActivationToken(req: Request, res: Response): Promise<void> {
    const token = req.query['token'];
    if (typeof token !== 'string' || !token) {
      throw new ValidationError('Token requerido');
    }
    const result = await validateActivationTokenUseCase.execute({ token });
    res.status(200).json(result);
  }

  async activateAccount(req: Request, res: Response): Promise<void> {
    const body = ActivateAccountDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    const result = await activateAccountUseCase.execute(body.data);
    res.status(200).json(result);
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const body = RequestPasswordResetDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Email inválido', body.error.flatten());
    await requestPasswordResetUseCase.execute(body.data);
    res.status(200).json({ message: 'Si el email existe, recibirás un enlace de recuperación.' });
  }

  async consumePasswordReset(req: Request, res: Response): Promise<void> {
    const body = ConsumePasswordResetDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    await consumePasswordResetUseCase.execute(body.data);
    res.status(204).send();
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const body = ChangePasswordDto.safeParse(req.body);
    if (!body.success) throw new ValidationError('Datos inválidos', body.error.flatten());
    await changePasswordUseCase.execute({ userId: req.user.id, ...body.data });
    res.status(204).send();
  }
}
