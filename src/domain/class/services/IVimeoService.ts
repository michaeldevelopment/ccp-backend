export interface IVimeoService {
  validateUrl(vimeoUrl: string): Promise<{ valid: boolean; message?: string }>;
}
