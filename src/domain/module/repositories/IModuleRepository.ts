import { Module } from '@domain/module/entities/Module';

export interface IModuleRepository {
  findAll(): Promise<Module[]>;
  findByNumber(number: number): Promise<Module | null>;
  update(number: number, data: { title?: string; description?: string }): Promise<Module>;
}
