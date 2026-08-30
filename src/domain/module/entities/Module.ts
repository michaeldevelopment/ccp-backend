export interface ModuleProps {
  id: string;
  number: number;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Module {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly description: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ModuleProps) {
    this.id = props.id;
    this.number = props.number;
    this.title = props.title;
    this.description = props.description;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
