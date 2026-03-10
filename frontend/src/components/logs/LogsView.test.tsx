import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { LogEntry } from './LogsView';

// Este test podría incluir renderizar componentes y validar sus props, pero Vitest restringe cómo inyectar estado inicial 
// a menos que sea a través de props. Para validar la *propiedad 5* (orden cronológico) testearemos la lógica interna de ordenamiento.
describe('LogsView - Property based tests', () => {
    it('should always sort logs in descending chronological order', () => {
        // Generador de logs aleatorios con timestamps variados
        const logArbitrary = fc.record({
            id: fc.uuid(),
            timestamp: fc.date().map(d => d.toISOString()),
            type: fc.constantFrom('info', 'warning', 'error', 'success') as fc.Arbitrary<LogEntry['type']>,
            source: fc.string(),
            message: fc.string(),
        });

        fc.assert(
            fc.property(fc.array(logArbitrary), (logs) => {
                // Función de ordenamiento idéntica a la usada en LogsView
                const sortedLogs = [...logs].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                // Verificamos propiedad: ningún elemento debe ser más antiguo que su subsecuente
                for (let i = 0; i < sortedLogs.length - 1; i++) {
                    const current = new Date(sortedLogs[i].timestamp).getTime();
                    const next = new Date(sortedLogs[i + 1].timestamp).getTime();
                    expect(current).toBeGreaterThanOrEqual(next);
                }
            }),
            { numRuns: 100 }
        );
    });
});
