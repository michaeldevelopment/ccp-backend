import { IReassignmentRepository } from '@domain/reassignment/repositories/IReassignmentRepository';
import { ReassignmentResult, toReassignmentResult } from './reassignmentResult';

export class ListReassignmentsUseCase {
  constructor(private readonly reassignmentRepo: IReassignmentRepository) {}

  async execute(): Promise<ReassignmentResult[]> {
    const records = await this.reassignmentRepo.findPending();
    return records.map(toReassignmentResult);
  }
}
