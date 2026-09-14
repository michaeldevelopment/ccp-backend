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
  it('currentModule() retorna el último elemento de unlockedModules', () => {
    expect(makeGroup([1, 2, 3]).currentModule()).toBe(3);
    expect(makeGroup([5]).currentModule()).toBe(5);
    expect(makeGroup([3, 4, 5, 6, 7, 8, 9, 1]).currentModule()).toBe(1);
  });

  it('currentModule() lanza Error con unlockedModules vacío', () => {
    expect(() => makeGroup([]).currentModule()).toThrow('Grupo sin módulos desbloqueados');
  });

  it('canAdvance() es true cuando el módulo actual es menor que 9', () => {
    expect(makeGroup([1, 2, 3]).canAdvance()).toBe(true);
  });

  it('canAdvance() es true en M9 si aún faltan módulos por wrap (empezó > 1)', () => {
    expect(makeGroup([3, 4, 5, 6, 7, 8, 9], 3).canAdvance()).toBe(true);
  });

  it('canAdvance() es false cuando unlockedModules cubre los 9 módulos', () => {
    expect(makeGroup([1, 2, 3, 4, 5, 6, 7, 8, 9]).canAdvance()).toBe(false);
    expect(makeGroup([3, 4, 5, 6, 7, 8, 9, 1, 2], 3).canAdvance()).toBe(false);
  });

  it('nextModule() retorna currentModule+1 cuando < 9', () => {
    expect(makeGroup([1, 2, 3]).nextModule()).toBe(4);
    expect(makeGroup([3, 4, 5, 6, 7, 8]).nextModule()).toBe(9);
  });

  it('nextModule() retorna 1 cuando currentModule es 9 (wrap)', () => {
    expect(makeGroup([1, 2, 3, 4, 5, 6, 7, 8, 9]).nextModule()).toBe(1);
  });

  it('canRetreat() es false cuando unlockedModules tiene 1 elemento', () => {
    expect(makeGroup([3], 3).canRetreat()).toBe(false);
    expect(makeGroup([1], 1).canRetreat()).toBe(false);
  });

  it('canRetreat() es true cuando hay más de un módulo', () => {
    expect(makeGroup([1, 2, 3], 1).canRetreat()).toBe(true);
    expect(makeGroup([3, 4, 5, 6, 7, 8, 9, 1], 3).canRetreat()).toBe(true);
  });
});
