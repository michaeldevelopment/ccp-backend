import { IActivationTokenRepository } from '@domain/user/repositories/IActivationTokenRepository';
import { NotFoundError, GoneError } from '@domain/shared/errors';

interface ValidateActivationTokenInput {
  token: string;
}

interface ValidateActivationTokenResult {
  email: string;
}

export class ValidateActivationTokenUseCase {
  constructor(private readonly activationTokenRepo: IActivationTokenRepository) {}

  async execute(input: ValidateActivationTokenInput): Promise<ValidateActivationTokenResult> {
    const record = await this.activationTokenRepo.findByToken(input.token);

    if (!record) {
      throw new NotFoundError('Token de activación no encontrado');
    }

    if (record.usedAt !== null) {
      throw new GoneError('Token de activación ya fue utilizado');
    }

    return { email: record.user.email };
  }
}
