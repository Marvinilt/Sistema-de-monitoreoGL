import { useState } from 'react';

interface Props {
  onAgregar: (nombre: string, host: string) => Promise<void>;
}

export function AddServerForm({ onAgregar }: Props) {
  const [nombre, setNombre] = useState('');
  const [host, setHost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !host.trim()) return;
    setError(null);
    setEnviando(true);
    try {
      await onAgregar(nombre.trim(), host.trim());
      setNombre('');
      setHost('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm text-gray-700">Agregar Servidor</h3>
      <div className="flex gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          className="flex-1 border rounded px-2 py-1.5 text-sm"
          required
        />
        <input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="IP o hostname"
          className="flex-1 border rounded px-2 py-1.5 text-sm"
          required
        />
        <button
          type="submit"
          disabled={enviando}
          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {enviando ? '...' : 'Agregar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
