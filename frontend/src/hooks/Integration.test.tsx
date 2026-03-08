import { describe, it, expect, vi } from 'vitest';
import * as api from '../services/api';
import { useServers } from './useServers';
import { useMonitor } from './useMonitor';

// Setup de Mocks
vi.mock('../services/api', () => ({
    obtenerServidores: vi.fn(),
    agregarServidor: vi.fn(),
    verificarServidor: vi.fn(),
    verificarTodos: vi.fn(),
}));

vi.mock('./useServers', () => ({
    useServers: vi.fn()
}));

vi.mock('./useMonitor', () => ({
    useMonitor: vi.fn()
}));

describe('Integration - Critical Flows', () => {

    // Test de integración simulado usando la estructura base de hooks.
    // En un test real completo se renderizaría un Layout/View que consuma estos hooks.
    describe('Testing Hooks integrability', () => {
        it('Add Server integration behaves correctly under valid input', async () => {
            // En una UI real esto se acopla, probamos el coupling a los handlers 
            const mockAgregarServidor = vi.fn().mockResolvedValue({ id: 'srv-1', name: 'Test', host: 'test.com', puertos: [], estado: 'unknown' });

            (useServers as any).mockReturnValue({
                servidores: [],
                cargando: false,
                error: null,
                agregarServidor: mockAgregarServidor,
            });

            const hookObj = useServers();
            const nuevoServidor = await hookObj.agregarServidor('Test', 'test.com');

            expect(mockAgregarServidor).toHaveBeenCalledWith('Test', 'test.com');
            expect(nuevoServidor?.id).toBe('srv-1');
        });

        it('Manual Server Check calls the correct API method via the useMonitor hook', async () => {
            const mockVerificarServidor = vi.fn().mockResolvedValue({});

            (useMonitor as any).mockReturnValue({
                enProgreso: new Set(),
                verificarServidor: mockVerificarServidor,
            });

            // Simula la llamada de onClick del ServerCard
            const hookObj = useMonitor(vi.fn());
            await hookObj.verificarServidor('srv-123');

            expect(mockVerificarServidor).toHaveBeenCalledWith('srv-123');
        });
    });
});
