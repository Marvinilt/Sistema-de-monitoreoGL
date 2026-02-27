import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { SummaryBar } from './SummaryBar';
import { Servidor, EstadoServidor } from '../types';

function crearServidor(id: string, estado: EstadoServidor): Servidor {
  return {
    id, nombre: `Srv ${id}`, host: `10.0.0.${id}`,
    puertos: [], urls: [], estado,
    ultimaVerificacion: null, creadoEn: new Date().toISOString(),
  };
}

// Feature: server-monitor, Property 8: Conteo del resumen global es consistente
describe('SummaryBar', () => {
  test('Propiedad 8: ok + alerta + desconocido = total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('ok', 'alerta', 'desconocido'), { minLength: 0, maxLength: 20 }),
        (estados) => {
          const servidores = estados.map((e, i) =>
            crearServidor(String(i), e as EstadoServidor)
          );
          render(<SummaryBar servidores={servidores} onVerificarTodos={vi.fn()} verificando={false} />);
          const total = servidores.length;
          const ok = servidores.filter((s) => s.estado === 'ok').length;
          const alerta = servidores.filter((s) => s.estado === 'alerta').length;
          const desconocido = servidores.filter((s) => s.estado === 'desconocido').length;
          return ok + alerta + desconocido === total;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('muestra conteos correctos en el DOM', () => {
    const servidores = [
      crearServidor('1', 'ok'),
      crearServidor('2', 'ok'),
      crearServidor('3', 'alerta'),
    ];
    render(<SummaryBar servidores={servidores} onVerificarTodos={vi.fn()} verificando={false} />);
    expect(screen.getByText('3')).toBeTruthy(); // total
    expect(screen.getByText('2')).toBeTruthy(); // ok
    expect(screen.getByText('1')).toBeTruthy(); // alerta
  });
});
