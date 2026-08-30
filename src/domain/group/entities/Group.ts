export interface GroupProps {
  id: string;
  name: string;
  entryModule: number;
  unlockedModules: number[];
  createdAt: Date;
  updatedAt: Date;
}

export class Group {
  readonly id: string;
  readonly name: string;
  readonly entryModule: number;
  readonly unlockedModules: number[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: GroupProps) {
    this.id = props.id;
    this.name = props.name;
    this.entryModule = props.entryModule;
    this.unlockedModules = props.unlockedModules;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  currentModule(): number {
    if (this.unlockedModules.length === 0) {
      throw new Error('Grupo sin módulos desbloqueados');
    }
    return Math.max(...this.unlockedModules);
  }

  canAdvance(): boolean {
    return this.currentModule() < 9;
  }

  canRetreat(): boolean {
    return this.currentModule() > this.entryModule;
  }
}
