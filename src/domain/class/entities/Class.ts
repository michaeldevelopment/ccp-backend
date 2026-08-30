export interface Attachment {
  name: string;
  url: string;
}

export interface ClassProps {
  id: string;
  moduleId: string;
  moduleNumber: number;
  title: string;
  description: string;
  vimeoUrl: string;
  attachments: Attachment[];
  publishedAt: Date | null;
  isPublished: boolean;
  notify: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Class {
  readonly id: string;
  readonly moduleId: string;
  readonly moduleNumber: number;
  readonly title: string;
  readonly description: string;
  readonly vimeoUrl: string;
  readonly attachments: Attachment[];
  readonly publishedAt: Date | null;
  readonly isPublished: boolean;
  readonly notify: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ClassProps) {
    this.id = props.id;
    this.moduleId = props.moduleId;
    this.moduleNumber = props.moduleNumber;
    this.title = props.title;
    this.description = props.description;
    this.vimeoUrl = props.vimeoUrl;
    this.attachments = props.attachments;
    this.publishedAt = props.publishedAt;
    this.isPublished = props.isPublished;
    this.notify = props.notify;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
