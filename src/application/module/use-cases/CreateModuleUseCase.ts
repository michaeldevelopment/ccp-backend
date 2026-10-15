import { IModuleRepository } from '@domain/module/repositories/IModuleRepository';
import { BusinessLogicError, ConflictError } from '@domain/shared/errors';
import { ModuleResult, toModuleResult } from './moduleResult';

/** El programa CCP son 9 módulos: el catálogo no puede crecer más allá de ese universo. */
const TOTAL_MODULES = 9;

interface CreateModuleInput {
  number?: number;
  title: string;
  description: string;
}

export class CreateModuleUseCase {
  constructor(private readonly moduleRepo: IModuleRepository) {}

  async execute(input: CreateModuleInput): Promise<ModuleResult> {
    const existing = await this.moduleRepo.findAll();
    const taken = new Set(existing.map((m) => m.number));

    const number = input.number ?? firstFreeNumber(taken);

    if (taken.has(number)) {
      throw new ConflictError(`Ya existe un módulo con el número ${number}`);
    }

    const created = await this.moduleRepo.create({
      number,
      title: input.title,
      description: input.description,
    });

    // Un COACH ve siempre el catálogo completo desbloqueado.
    return toModuleResult(created, true);
  }
}

function firstFreeNumber(taken: Set<number>): number {
  for (let n = 1; n <= TOTAL_MODULES; n++) {
    if (!taken.has(n)) return n;
  }
  throw new BusinessLogicError(`El programa ya tiene sus ${TOTAL_MODULES} módulos creados`);
}
