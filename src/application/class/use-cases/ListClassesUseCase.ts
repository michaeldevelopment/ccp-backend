import { IClassRepository } from '@domain/class/repositories/IClassRepository';
import { ClassResult, toClassResult } from './classResult';

interface ListClassesInput {
  moduleNumber?: number;
}

export class ListClassesUseCase {
  constructor(private readonly classRepo: IClassRepository) {}

  async execute(input: ListClassesInput): Promise<ClassResult[]> {
    const classes = await this.classRepo.findMany({ moduleNumber: input.moduleNumber });
    return classes.map(toClassResult);
  }
}
