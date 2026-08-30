import { Module } from '@domain/module/entities/Module';

export interface ModuleResult {
  id: string;
  number: number;
  title: string;
  description: string;
  isUnlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toModuleResult(module: Module, isUnlocked: boolean): ModuleResult {
  return {
    id: module.id,
    number: module.number,
    title: module.title,
    description: module.description,
    isUnlocked,
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  };
}
