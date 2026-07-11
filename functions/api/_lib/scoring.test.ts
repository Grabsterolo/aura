import { describe, expect, it } from 'vitest';
import { scoreProspect, type ScoringAudit, type ScoringProspect } from './scoring';

const CONTACTABLE: ScoringProspect = { contactable: true };
const NO_CONTACTABLE: ScoringProspect = { contactable: false };

const BASE_AUDIT: ScoringAudit = {
  velocidad: { performance_score: 80 },
  medio_contacto: { chatbot_ia: false },
  funcionalidad_sitio: { tipo: 'landing' },
};

describe('scoreProspect', () => {
  it('regla 1: sin contactable -> baja, sin_correo, sin importar el resto de señales', () => {
    const result = scoreProspect(NO_CONTACTABLE, {
      ...BASE_AUDIT,
      funcionalidad_sitio: { tipo: 'sin_sitio_web' },
    });

    expect(result.puntaje).toBe(20);
    expect(result.criterio_usado.tier).toBe('baja');
    expect(result.criterio_usado.regla).toBe('sin_correo');
    expect(result.criterio_usado.senales.contactable).toBe(false);
  });

  it('regla 2: chatbot_ia detectado -> baja, chatbot_existente', () => {
    const result = scoreProspect(CONTACTABLE, {
      ...BASE_AUDIT,
      medio_contacto: { chatbot_ia: true },
    });

    expect(result.puntaje).toBe(20);
    expect(result.criterio_usado.tier).toBe('baja');
    expect(result.criterio_usado.regla).toBe('chatbot_existente');
    expect(result.criterio_usado.senales.tiene_chatbot_ia).toBe(true);
  });

  it('regla 3: sin sitio web -> alta, sin_sitio_web', () => {
    const result = scoreProspect(CONTACTABLE, {
      velocidad: null,
      medio_contacto: { chatbot_ia: false },
      funcionalidad_sitio: { tipo: 'sin_sitio_web' },
    });

    expect(result.puntaje).toBe(90);
    expect(result.criterio_usado.tier).toBe('alta');
    expect(result.criterio_usado.regla).toBe('sin_sitio_web');
    expect(result.criterio_usado.senales.tipo_sitio).toBe('sin_sitio_web');
  });

  it('regla 4: funcionalidad_sitio.error presente -> alta, sitio_inaccesible', () => {
    const result = scoreProspect(CONTACTABLE, {
      ...BASE_AUDIT,
      funcionalidad_sitio: { tipo: 'desconocido', error: 'Firecrawl HTTP 500' },
    });

    expect(result.puntaje).toBe(90);
    expect(result.criterio_usado.tier).toBe('alta');
    expect(result.criterio_usado.regla).toBe('sitio_inaccesible');
    expect(result.criterio_usado.senales.audit_fallo).toBe(true);
  });

  it('regla 4: velocidad.error presente -> alta, sitio_inaccesible', () => {
    const result = scoreProspect(CONTACTABLE, {
      ...BASE_AUDIT,
      velocidad: { performance_score: null, error: 'PageSpeed HTTP 500' },
    });

    expect(result.puntaje).toBe(90);
    expect(result.criterio_usado.regla).toBe('sitio_inaccesible');
    expect(result.criterio_usado.senales.audit_fallo).toBe(true);
  });

  it('regla 5: performance_score bajo -> alta, sitio_lento', () => {
    const result = scoreProspect(CONTACTABLE, {
      ...BASE_AUDIT,
      velocidad: { performance_score: 35 },
    });

    expect(result.puntaje).toBe(90);
    expect(result.criterio_usado.tier).toBe('alta');
    expect(result.criterio_usado.regla).toBe('sitio_lento');
    expect(result.criterio_usado.senales.performance_score).toBe(35);
  });

  it('regla 6: sitio ecommerce -> baja, sitio_maduro', () => {
    const result = scoreProspect(CONTACTABLE, {
      ...BASE_AUDIT,
      funcionalidad_sitio: { tipo: 'ecommerce' },
    });

    expect(result.puntaje).toBe(20);
    expect(result.criterio_usado.tier).toBe('baja');
    expect(result.criterio_usado.regla).toBe('sitio_maduro');
  });

  it('regla 6: sitio portal -> baja, sitio_maduro', () => {
    const result = scoreProspect(CONTACTABLE, {
      ...BASE_AUDIT,
      funcionalidad_sitio: { tipo: 'portal' },
    });

    expect(result.puntaje).toBe(20);
    expect(result.criterio_usado.regla).toBe('sitio_maduro');
  });

  it('regla 7 (default): sitio funcional sin señales fuertes -> media, sin_senal_fuerte', () => {
    const result = scoreProspect(CONTACTABLE, BASE_AUDIT);

    expect(result.puntaje).toBe(60);
    expect(result.criterio_usado.tier).toBe('media');
    expect(result.criterio_usado.regla).toBe('sin_senal_fuerte');
  });

  it('prioriza sin_correo sobre cualquier otra señal, aunque el sitio esté caído', () => {
    const result = scoreProspect(NO_CONTACTABLE, {
      velocidad: { performance_score: null, error: 'timeout' },
      medio_contacto: { chatbot_ia: true },
      funcionalidad_sitio: { tipo: 'desconocido', error: 'timeout' },
    });

    expect(result.criterio_usado.regla).toBe('sin_correo');
  });
});
