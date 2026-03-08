// Feature: frontend-redesign-futurista, Propiedad 6: formato uptime
// Validates: Requirements 3.9

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { formatUptime, Header } from './Header';

describe('formatUptime - Propiedad 6: formato uptime', () => {
  it('produce cadena no vacía para cualquier uptimeSeconds >= 0', () => {
    // Property: for any non-negative seconds, formatUptime returns a non-empty string
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        (seconds) => {
          const result = formatUptime(seconds);
          return result.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('el formato contiene separadores de tiempo legibles', () => {
    // Property: result always contains ':' as time separator
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        (seconds) => {
          const result = formatUptime(seconds);
          return result.includes(':');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valores específicos conocidos', () => {
    expect(formatUptime(0)).toBe('00:00:00');
    expect(formatUptime(3661)).toBe('01:01:01');
    expect(formatUptime(86400)).toBe('1d 00:00:00');
    expect(formatUptime(90061)).toBe('1d 01:01:01');
  });

  it('maneja valores grandes sin error', () => {
    expect(() => formatUptime(999_999_999)).not.toThrow();
    expect(formatUptime(999_999_999).length).toBeGreaterThan(0);
  });
});

describe('Header', () => {
  it('renderiza el indicador de estado operacional', () => {
    const { getByText } = render(<Header systemStatus="operational" uptimeSeconds={3600} />);
    expect(getByText('Operational')).toBeTruthy();
  });

  it('muestra el uptime formateado', () => {
    const { getByText } = render(<Header uptimeSeconds={3661} />);
    expect(getByText('01:01:01')).toBeTruthy();
  });

  it('tiene botón de notificaciones con aria-label', () => {
    const { getByRole } = render(<Header />);
    expect(getByRole('button', { name: 'Notificaciones' })).toBeTruthy();
  });

  it('tiene botón de configuración con aria-label', () => {
    const { getByRole } = render(<Header />);
    expect(getByRole('button', { name: 'Configuración' })).toBeTruthy();
  });
});
