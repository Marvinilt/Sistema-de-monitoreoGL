import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { ServerCard, ServerCardProps } from './ServerCard';

// Generador de puertos
const portStatusArbitrary = fc.record({
    port: fc.integer({ min: 1, max: 65535 }),
    status: fc.constantFrom('open', 'closed') as fc.Arbitrary<'open' | 'closed'>,
    protocol: fc.constantFrom('tcp', 'udp'),
});

// Generador de props para ServerCard
const serverCardPropsArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    host: fc.ipV4(),
    status: fc.constantFrom('ok', 'alert', 'warning', 'unknown') as fc.Arbitrary<ServerCardProps['status']>,
    ports: fc.uniqueArray(portStatusArbitrary, { maxLength: 10, selector: p => p.port }),
});

describe('ServerCard - Property based tests', () => {
    it('should render the correct glow classes and LED indicators based on status properties', () => {
        fc.assert(
            fc.property(serverCardPropsArbitrary, (props) => {
                const onCheck = vi.fn();
                const onClick = vi.fn();

                const { container, unmount } = render(
                    <ServerCard
                        {...props}
                        onCheck={onCheck}
                        onClick={onClick}
                    />
                );

                // Propiedad 1: Clase glow correcta en el panel principal
                const panel = container.firstChild as HTMLElement;
                if (props.status === 'alert') {
                    expect(panel.className).toContain('glow-danger');
                    expect(panel.className).not.toContain('glow-success');
                } else {
                    expect(panel.className).toContain('glow-success');
                    expect(panel.className).not.toContain('glow-danger');
                }

                // Propiedad 2: Indicadores LED correctos en puertos
                props.ports.forEach((p) => {
                    // Buscamos el div contenedor de ese puerto por el texto del puerto
                    const portNumberText = screen.getByText(p.port.toString());
                    // El indicador LED es el elemento hermano anterior con aria-hidden
                    const ledIndicator = portNumberText.previousElementSibling as HTMLElement;

                    if (p.status === 'open') {
                        expect(ledIndicator.className).toContain('bg-accent-neon');
                        expect(ledIndicator.className).toContain('led-pulse');
                    } else {
                        expect(ledIndicator.className).toContain('bg-danger');
                        expect(ledIndicator.className).not.toContain('led-pulse');
                    }
                });

                // Limpiamos el DOM antes de la siguiente iteración de fast-check
                unmount();
            }),
            { numRuns: 100 }
        );
    });
});
