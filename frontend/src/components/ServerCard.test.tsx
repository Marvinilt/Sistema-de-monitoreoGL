import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ServerCard } from './ServerCard';
import { Servidor, EstadoServidor } from '../types';

function crearServidor(estado: EstadoServidor): Servidor {
  return {
    id: '1',
    nombre: 'Test Server',
    host: '192.168.1.1',
    puertos: [],
    urls: [],
    estado,
    ultimaVerificacion: null,
    creadoEn: new Date().toISOString(),
  };
}

// Feature: server-monitor, Property 7: Renderizado de tarjeta refleja estado del servidor
describe('ServerCard', () => {
  test('Propiedad 7a: Estado ok aplica estilos verdes', () => {
    fc.assert(
      fc.property(fc.constant('ok' as EstadoServidor), (estado) => {
        const { container } = render(
          <ServerCard
            servidor={crearServidor(estado)}
            enProgreso={false}
            onClick={vi.fn()}
            onVerificar={vi.fn()}
            onEliminar={vi.fn()}
          />
        );
        const card = container.firstChild as HTMLElement;
        return card.className.includes('green');
      }),
      { numRuns: 10 }
    );
  });

  test('Propiedad 7b: Estado alerta aplica estilos rojos', () => {
    fc.assert(
      fc.property(fc.constant('alerta' as EstadoServidor), (estado) => {
        const { container } = render(
          <ServerCard
            servidor={crearServidor(estado)}
            enProgreso={false}
            onClick={vi.fn()}
            onVerificar={vi.fn()}
            onEliminar={vi.fn()}
          />
        );
        const card = container.firstChild as HTMLElement;
        return card.className.includes('red');
      }),
      { numRuns: 10 }
    );
  });

  test('Propiedad 7c: Estilos ok y alerta son mutuamente excluyentes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ok', 'alerta' as EstadoServidor),
        (estado) => {
          const { container } = render(
            <ServerCard
              servidor={crearServidor(estado as EstadoServidor)}
              enProgreso={false}
              onClick={vi.fn()}
              onVerificar={vi.fn()}
              onEliminar={vi.fn()}
            />
          );
          const card = container.firstChild as HTMLElement;
          const tieneVerde = card.className.includes('green');
          const tieneRojo = card.className.includes('red');
          return !(tieneVerde && tieneRojo);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('muestra indicador de carga cuando enProgreso es true', () => {
    render(
      <ServerCard
        servidor={crearServidor('ok')}
        enProgreso={true}
        onClick={vi.fn()}
        onVerificar={vi.fn()}
        onEliminar={vi.fn()}
      />
    );
    expect(screen.getByText('Verificando...')).toBeTruthy();
  });
});
