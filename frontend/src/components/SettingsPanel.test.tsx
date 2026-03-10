import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';
import { ConfiguracionEmail } from '../types';

// Mock del módulo de API para evitar llamadas HTTP reales
vi.mock('../services/api', () => ({
  obtenerConfiguracion: vi.fn().mockResolvedValue({ intervaloMonitoreoSegundos: 60 }),
  actualizarConfiguracion: vi.fn().mockResolvedValue({ intervaloMonitoreoSegundos: 60 }),
  obtenerConfiguracionEmail: vi.fn().mockResolvedValue({
    habilitado: true,
    smtpHost: 'smtp.example.com',
    smtpPuerto: 587,
    smtpUsuario: 'monitor@example.com',
    smtpPassword: 'secret',
    remitente: 'Monitor <monitor@example.com>',
    destinatarios: ['admin@example.com', 'ops@example.com'],
  } as ConfiguracionEmail),
  actualizarConfiguracionEmail: vi.fn().mockResolvedValue({
    habilitado: true,
    smtpHost: 'smtp.example.com',
    smtpPuerto: 587,
    smtpUsuario: 'monitor@example.com',
    smtpPassword: 'secret',
    remitente: 'Monitor <monitor@example.com>',
    destinatarios: ['admin@example.com', 'ops@example.com'],
  } as ConfiguracionEmail),
  probarConexionEmail: vi.fn().mockResolvedValue({ ok: true, mensaje: 'Conexión exitosa' }),
}));

describe('SettingsPanel - sección de email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Requisito 1.5: El Panel_Configuracion SHALL mostrar un formulario con todos los campos
  test('renderiza el formulario con todos los campos SMTP y el botón Probar conexión', async () => {
    render(<SettingsPanel />);

    // Esperar a que se cargue la configuración de email
    await waitFor(() => {
      expect(screen.getByText('Configuración de notificaciones')).toBeTruthy();
    });

    // Campos SMTP
    expect(screen.getByPlaceholderText('smtp.example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('587')).toBeTruthy();
    expect(screen.getByPlaceholderText('usuario@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    expect(screen.getByPlaceholderText('Monitor Servidores <monitor@example.com>')).toBeTruthy();

    // Campo para nuevo destinatario
    expect(screen.getByPlaceholderText('nuevo@example.com')).toBeTruthy();

    // Botón "Probar conexión"
    expect(screen.getByText('Probar conexión')).toBeTruthy();

    // Botón guardar configuración de email
    expect(screen.getByText('Guardar configuración')).toBeTruthy();
  });

  // Requisito 1.6: Agregar destinatario incrementa la lista visible sin recargar la página
  test('agregar un destinatario incrementa la lista', async () => {
    render(<SettingsPanel />);

    // Esperar a que se carguen los destinatarios iniciales
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeTruthy();
    });

    const inputNuevo = screen.getByPlaceholderText('nuevo@example.com');
    const btnAgregar = screen.getByText('Agregar');

    // Verificar cantidad inicial: 2 destinatarios
    const destinatariosAntes = screen.getAllByRole('button', { name: /Eliminar/i });
    expect(destinatariosAntes).toHaveLength(2);

    // Agregar un nuevo destinatario
    fireEvent.change(inputNuevo, { target: { value: 'nuevo@example.com' } });
    fireEvent.click(btnAgregar);

    // La lista debe tener 3 destinatarios ahora
    await waitFor(() => {
      const destinatariosDespues = screen.getAllByRole('button', { name: /Eliminar/i });
      expect(destinatariosDespues).toHaveLength(3);
    });

    // El nuevo destinatario debe aparecer en la lista
    expect(screen.getByText('nuevo@example.com')).toBeTruthy();

    // El campo de entrada debe quedar vacío
    expect((inputNuevo as HTMLInputElement).value).toBe('');
  });

  // Requisito 1.7: Eliminar destinatario decrementa la lista visible sin recargar la página
  test('eliminar un destinatario decrementa la lista', async () => {
    render(<SettingsPanel />);

    // Esperar a que se carguen los destinatarios iniciales
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeTruthy();
    });

    // Verificar cantidad inicial: 2 destinatarios
    const botonesEliminar = screen.getAllByRole('button', { name: /Eliminar/i });
    expect(botonesEliminar).toHaveLength(2);

    // Eliminar el primer destinatario
    fireEvent.click(botonesEliminar[0]);

    // La lista debe tener 1 destinatario ahora
    await waitFor(() => {
      const destinatariosDespues = screen.getAllByRole('button', { name: /Eliminar/i });
      expect(destinatariosDespues).toHaveLength(1);
    });

    // El primer destinatario ya no debe aparecer
    expect(screen.queryByText('admin@example.com')).toBeNull();

    // El segundo destinatario sigue en la lista
    expect(screen.getByText('ops@example.com')).toBeTruthy();
  });
});
