import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useTheme } from './useTheme';

// Feature: frontend-redesign-futurista, Propiedad 1: round-trip persistencia del tema

describe('useTheme', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageMock[key] ?? null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => { localStorageMock[key] = value; }
    );
    // Reset documentElement classes
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Unit tests (subtask 2.3) ---

  it('aplica tema oscuro por defecto cuando localStorage está vacío', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('aplica tema oscuro por defecto cuando localStorage tiene un valor inválido', () => {
    localStorageMock['theme'] = 'invalid-value';
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('toggle cambia de dark a light', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggle cambia de light a dark', () => {
    localStorageMock['theme'] = 'light';
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  // --- Property test (subtask 2.2) ---
  // Validates: Requirements 2.4, 2.5, 2.6

  it('Propiedad 1: round-trip — el tema persistido en localStorage se restaura correctamente', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dark', 'light'),
        (selectedTheme: string) => {
          // Simular que el tema fue guardado previamente
          localStorageMock['theme'] = selectedTheme;
          document.documentElement.classList.remove('dark');

          const { result } = renderHook(() => useTheme());

          // El tema restaurado debe ser igual al seleccionado
          expect(result.current.theme).toBe(selectedTheme);
          expect(result.current.isDark).toBe(selectedTheme === 'dark');

          // El localStorage debe contener el mismo valor
          expect(localStorageMock['theme']).toBe(selectedTheme);
        }
      ),
      { numRuns: 100 }
    );
  });
});
