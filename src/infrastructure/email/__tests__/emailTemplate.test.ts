import { describe, it, expect } from 'vitest';
import { renderEmail } from '../emailTemplate';

const base = { eyebrow: 'E', heading: 'H' };

describe('renderEmail', () => {
  it('incluye el nombre en negrita cuando se pasa', () => {
    expect(renderEmail(base, 'Ana')).toContain(
      'Hola, <strong style="color:#1A1A1A;">Ana</strong>,'
    );
  });

  it('sin nombre usa un saludo genérico', () => {
    expect(renderEmail(base)).toContain('Hola,');
  });

  it('escapa HTML del nombre y del contenido', () => {
    const html = renderEmail({ ...base, heading: '<b>H</b>' }, '<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;H&lt;/b&gt;');
  });

  it('convierte **texto** en negrita sin dejar pasar HTML', () => {
    const html = renderEmail({ ...base, intro: 'Tu cuenta en **<b>CCP</b>** existe' });
    expect(html).toContain('<strong style="color:#1A1A1A;">&lt;b&gt;CCP&lt;/b&gt;</strong>');
  });

  it('escapa comillas en la URL del CTA para no romper el atributo href', () => {
    const html = renderEmail({
      ...base,
      cta: { label: 'Ir', url: 'https://x.com/"onmouseover="alert(1)' },
    });
    expect(html).not.toContain('onmouseover="alert(1)"');
    expect(html).toContain('&quot;');
  });

  it('sin cta no renderiza botón', () => {
    expect(renderEmail(base)).not.toContain('<a href');
  });

  it('renderiza el bloque de clase y las líneas del aviso', () => {
    const html = renderEmail({
      ...base,
      highlight: { badge: 'MÓDULO 3', title: 'Reconociendo tus patrones' },
      notice: ['Primera', 'Segunda'],
    });
    expect(html).toContain('MÓDULO 3');
    expect(html).toContain('Reconociendo tus patrones');
    expect(html).toContain('Primera');
    expect(html).toContain('Segunda');
  });
});
