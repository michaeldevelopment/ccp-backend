import { IVimeoService } from '@domain/class/services/IVimeoService';

export class ValidateVimeoUseCase {
  constructor(private readonly vimeoService: IVimeoService) {}

  async execute(_input: { vimeoUrl: string }): Promise<{ valid: boolean; message?: string }> {
    // TODO: re-habilitar validación real cuando haya VIMEO_ACCESS_TOKEN y URLs reales
    // return this.vimeoService.validateUrl(input.vimeoUrl);
    return { valid: true };
  }
}
