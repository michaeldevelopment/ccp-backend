import { describe, it, expect } from 'vitest';
import { Group } from '@domain/group/entities/Group';

function makeGroup(unlockedModules: number[], entryModule = 1): Group {
  return new Group({
    id: 'g-1',
    name: 'G1',
    entryModule,
    unlockedModules,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('Group entity', () => {
  it('currentModule() retorna el módulo máximo', () => {
    expect(makeGroup([1, 2, 3]).currentModule()).toBe(3);
    expect(makeGroup([5]).currentModule()).toBe(5);
  });

  it('currentModule() lanza Error con unlockedModules vacío', () => {
    expect(() => makeGroup([]).currentModule()).toThrow('Grupo sin módulos desbloqueados');
  });

  it('canAdvance() es false cuando el módulo actual es 9', () => {
    expect(makeGroup([1, 2, 3, 4, 5, 6, 7, 8, 9]).canAdvance()).toBe(false);
  });

  it('canAdvance() es true cuando el módulo actual es menor que 9', () => {
    expect(makeGroup([1, 2, 3]).canAdvance()).toBe(true);
  });

  it('canRetreat() es false cuando el módulo actual es igual a entryModule', () => {
    expect(makeGroup([3], 3).canRetreat()).toBe(false);
    expect(makeGroup([1], 1).canRetreat()).toBe(false);
  });

  it('canRetreat() es true cuando el módulo actual es mayor que entryModule', () => {
    expect(makeGroup([1, 2, 3], 1).canRetreat()).toBe(true);
  });
});
