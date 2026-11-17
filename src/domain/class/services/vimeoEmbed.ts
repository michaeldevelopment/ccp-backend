const VIMEO_ID_RE = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)(?:\/(\w+))?/;
const HASH_QUERY_RE = /[?&]h=(\w+)/;

// Los videos no listados requieren el hash de privacidad en el embed, o Vimeo responde error.
export function toEmbedUrl(vimeoUrl: string): string {
  const match = VIMEO_ID_RE.exec(vimeoUrl);
  if (!match) return '';
  const hash = match[2] ?? HASH_QUERY_RE.exec(vimeoUrl)?.[1];
  return `https://player.vimeo.com/video/${match[1]}${hash ? `?h=${hash}` : ''}`;
}
