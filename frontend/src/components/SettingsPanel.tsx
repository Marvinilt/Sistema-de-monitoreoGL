import { useState, useEffect } from 'react';
import { obtenerConfiguracion, actualizarConfiguracion, obtenerConfiguracionEmail, actualizarConfiguracionEmail, probarConexionEmail } from '../services/api';
import { ConfiguracionEmail } from '../types';

const EMAIL_VACIO: ConfiguracionEmail = {
  habilitado: false,
  smtpHost: '',
  smtpPuerto: 587,
  smtpUsuario: '',
  smtpPassword: '',
  remitente: '',
  destinatarios: [],
};

export function SettingsPanel() {
  // --- Configuración general ---
  const [intervalo, setIntervalo] = useState(60);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // --- Configuración de email ---
  const [email, setEmail] = useState<ConfiguracionEmail>(EMAIL_VACIO);
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  const [mensajeEmail, setMensajeEmail] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [nuevoDestinatario, setNuevoDestinatario] = useState('');
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; mensaje: string } | null>(null);

  useEffect(() => {
    obtenerConfiguracion().then((c) => setIntervalo(c.intervaloMonitoreoSegundos));
    obtenerConfiguracionEmail().then((c) => {
      if (c) setEmail(c);
    });
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await actualizarConfiguracion({ intervaloMonitoreoSegundos: intervalo });
      setMensaje('Configuración guardada');
    } catch (err) {
      setMensaje((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoEmail(true);
    setMensajeEmail(null);
    try {
      const actualizado = await actualizarConfiguracionEmail(email);
      setEmail(actualizado);
      setMensajeEmail({ tipo: 'ok', texto: 'Configuración de email guardada' });
    } catch (err) {
      setMensajeEmail({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setGuardandoEmail(false);
    }
  };

  const handleAgregarDestinatario = () => {
    const trimmed = nuevoDestinatario.trim();
    if (!trimmed) return;
    setEmail((prev) => ({ ...prev, destinatarios: [...prev.destinatarios, trimmed] }));
    setNuevoDestinatario('');
  };

  const handleEliminarDestinatario = (idx: number) => {
    setEmail((prev) => ({
      ...prev,
      destinatarios: prev.destinatarios.filter((_, i) => i !== idx),
    }));
  };

  const handleProbarConexion = async () => {
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const resultado = await probarConexionEmail(email);
      setResultadoPrueba(resultado);
    } catch (err) {
      setResultadoPrueba({ ok: false, mensaje: (err as Error).message });
    } finally {
      setProbando(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Configuración general */}
      <form onSubmit={handleGuardar} className="flex items-center gap-3 text-sm">
        <label htmlFor="intervalo" className="text-gray-600 whitespace-nowrap">
          Intervalo de monitoreo:
        </label>
        <input
          id="intervalo"
          type="number"
          min={30}
          max={3600}
          value={intervalo}
          onChange={(e) => setIntervalo(Number(e.target.value))}
          className="w-24 border rounded px-2 py-1 text-sm"
        />
        <span className="text-gray-500">seg</span>
        <button
          type="submit"
          disabled={guardando}
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {guardando ? '...' : 'Guardar'}
        </button>
        {mensaje && <span className="text-xs text-green-700">{mensaje}</span>}
      </form>

      {/* Notificaciones por Email */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Notificaciones por Email</h2>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-gray-600">
              {email.habilitado ? 'Habilitado' : 'Deshabilitado'}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={email.habilitado}
                onChange={(e) => setEmail((prev) => ({ ...prev, habilitado: e.target.checked }))}
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${email.habilitado ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${email.habilitado ? 'translate-x-5' : ''}`}
              />
            </div>
          </label>
        </div>

        <form onSubmit={handleGuardarEmail} className="space-y-4">
          {/* Campos SMTP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">SMTP Host</label>
              <input
                type="text"
                value={email.smtpHost}
                onChange={(e) => setEmail((prev) => ({ ...prev, smtpHost: e.target.value }))}
                placeholder="smtp.example.com"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Puerto</label>
              <input
                type="number"
                value={email.smtpPuerto}
                onChange={(e) => setEmail((prev) => ({ ...prev, smtpPuerto: Number(e.target.value) }))}
                placeholder="587"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Usuario</label>
              <input
                type="text"
                value={email.smtpUsuario}
                onChange={(e) => setEmail((prev) => ({ ...prev, smtpUsuario: e.target.value }))}
                placeholder="usuario@example.com"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
              <input
                type="password"
                value={email.smtpPassword}
                onChange={(e) => setEmail((prev) => ({ ...prev, smtpPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Remitente</label>
              <input
                type="text"
                value={email.remitente}
                onChange={(e) => setEmail((prev) => ({ ...prev, remitente: e.target.value }))}
                placeholder="Monitor Servidores <monitor@example.com>"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>

          {/* Lista de destinatarios */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Destinatarios</label>
            <div className="space-y-1 mb-2">
              {email.destinatarios.length === 0 && (
                <p className="text-xs text-gray-400 italic">Sin destinatarios configurados</p>
              )}
              {email.destinatarios.map((dest, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex-1 text-sm bg-gray-50 border rounded px-2 py-1">{dest}</span>
                  <button
                    type="button"
                    onClick={() => handleEliminarDestinatario(idx)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold px-1"
                    aria-label={`Eliminar ${dest}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={nuevoDestinatario}
                onChange={(e) => setNuevoDestinatario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarDestinatario())}
                placeholder="nuevo@example.com"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={handleAgregarDestinatario}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={guardandoEmail}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
            >
              {guardandoEmail ? '...' : 'Guardar configuración'}
            </button>
            <button
              type="button"
              onClick={handleProbarConexion}
              disabled={probando}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm transition-colors"
            >
              {probando ? 'Probando...' : 'Probar conexión'}
            </button>
            {mensajeEmail && (
              <span className={`text-xs ${mensajeEmail.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                {mensajeEmail.texto}
              </span>
            )}
          </div>

          {/* Resultado prueba de conexión */}
          {resultadoPrueba && (
            <div
              className={`text-sm rounded px-3 py-2 ${resultadoPrueba.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
            >
              {resultadoPrueba.ok ? '✓' : '✗'} {resultadoPrueba.mensaje}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
