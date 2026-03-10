// Feature: frontend-redesign-futurista, Propiedad 7: nav activa Sidebar
// Validates: Requirements 3.6, 4.2

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';
import { Sidebar } from './Sidebar';

const VALID_ROUTES = ['/', '/servers', '/settings', '/parameters', '/logs'];

describe('Sidebar - Propiedad 7: navegación activa', () => {
  it('exactamente un ítem está activo para cada ruta válida', () => {
    // Property: for any valid route, exactly one nav item is marked active
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_ROUTES),
        (route) => {
          const { container } = render(
            <MemoryRouter initialEntries={[route]}>
              <Sidebar />
            </MemoryRouter>
          );

          // Active links have the 'text-primary' class (from NavLink isActive styling)
          const allLinks = container.querySelectorAll('a');
          const activeLinks = Array.from(allLinks).filter((link) =>
            link.className.includes('text-primary')
          );

          // Exactly one item must be active
          return activeLinks.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('el ítem activo corresponde a la ruta actual', () => {
    // Property: the active item's href matches the current route
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_ROUTES),
        (route) => {
          const { container } = render(
            <MemoryRouter initialEntries={[route]}>
              <Sidebar />
            </MemoryRouter>
          );

          const allLinks = container.querySelectorAll('a');
          const activeLink = Array.from(allLinks).find((link) =>
            link.className.includes('text-primary')
          );

          if (!activeLink) return false;

          const href = activeLink.getAttribute('href') ?? '';
          return href === route;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Requisito 3.4 y 3.5: Navegación simple ("Tablero", "Servidores", "Config. SMTP", "Config. Parámetros", "Registros")
  it('renderiza los 5 ítems de navegación', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(5);
  });

  it('muestra el logo MonitorSistemas-GL', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );
    expect(getByText('MonitorSistemas-GL')).toBeTruthy();
  });

  it('muestra la versión v2.4.0-Alpha', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );
    expect(getByText('v2.4.0-Alpha')).toBeTruthy();
  });
});
