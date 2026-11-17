import { describe, it, expect } from 'vitest';
import { toEmbedUrl } from '@domain/class/services/vimeoEmbed';

describe('toEmbedUrl', () => {
  it('URL estándar de vimeo.com → embed con el id extraído', () => {
    expect(toEmbedUrl('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789'
    );
  });

  it('URL ya en formato player.vimeo.com → embed con el id extraído', () => {
    expect(toEmbedUrl('https://player.vimeo.com/video/123456789')).toBe(
      'https://player.vimeo.com/video/123456789'
    );
  });

  it('URL no parseable → string vacío, nunca la URL original', () => {
    expect(toEmbedUrl('https://example.com/not-vimeo')).toBe('');
  });

  it('string vacío → string vacío', () => {
    expect(toEmbedUrl('')).toBe('');
  });

  it('video no listado con hash en el path → embed conserva el hash', () => {
    expect(toEmbedUrl('https://vimeo.com/123456789/a1b2c3d4e5')).toBe(
      'https://player.vimeo.com/video/123456789?h=a1b2c3d4e5'
    );
  });

  it('hash en query string → embed conserva el hash', () => {
    expect(toEmbedUrl('https://player.vimeo.com/video/123456789?h=a1b2c3d4e5')).toBe(
      'https://player.vimeo.com/video/123456789?h=a1b2c3d4e5'
    );
  });

  it('URL real de producción con hash y params de share → hash conservado, params descartados', () => {
    expect(toEmbedUrl('https://vimeo.com/1218188707/481c820f19?share=copy&fl=sv&fe=ci')).toBe(
      'https://player.vimeo.com/video/1218188707?h=481c820f19'
    );
  });

  it('URL pública con params de share → sin hash, params descartados', () => {
    expect(toEmbedUrl('https://vimeo.com/1244033639?share=copy&fl=sv&fe=ci')).toBe(
      'https://player.vimeo.com/video/1244033639'
    );
  });

  it('URL del dashboard de Vimeo (no soportada) → string vacío', () => {
    expect(toEmbedUrl('https://vimeo.com/manage/videos/123456789')).toBe('');
  });
});
