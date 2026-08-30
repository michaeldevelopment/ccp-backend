import { IVimeoService } from '@domain/class/services/IVimeoService';
import { env } from '@config/env';
import { logger } from '@config/logger';
import axios from 'axios';

const VIMEO_ID_REGEX = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;

export class VimeoService implements IVimeoService {
  async validateUrl(vimeoUrl: string): Promise<{ valid: boolean; message?: string }> {
    const match = VIMEO_ID_REGEX.exec(vimeoUrl);
    if (!match) {
      return {
        valid: false,
        message: 'URL de Vimeo inválida. Formato esperado: https://vimeo.com/{id}',
      };
    }

    const videoId = match[1];

    try {
      await axios.get(`https://api.vimeo.com/videos/${videoId}`, {
        headers: { Authorization: `bearer ${env.VIMEO_ACCESS_TOKEN}` },
      });
      return { valid: true };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          return { valid: false, message: 'El video de Vimeo no existe o no es accesible' };
        }
        if (err.response) {
          return {
            valid: false,
            message: `Error al verificar el video de Vimeo (status ${err.response.status})`,
          };
        }
      }
      logger.error({ message: 'Error al conectar con Vimeo API', error: err, vimeoUrl });
      return {
        valid: false,
        message: 'No se pudo verificar el video de Vimeo. Intenta nuevamente.',
      };
    }
  }
}
