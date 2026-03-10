import { useState, useEffect, useCallback } from 'react';
import { Servidor } from '../types';
import * as api from '../services/api';

export function useServers() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await api.obtenerServidores();
      setServidores(data);
    } catch {
      setError('Error al cargar servidores');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const actualizarServidor = useCallback((servidor: Servidor) => {
    setServidores((prev) =>
      prev.map((s) => (s.id === servidor.id ? servidor : s))
    );
  }, []);

  const agregarServidor = useCallback(async (nombre: string, host: string) => {
    const nuevo = await api.agregarServidor(nombre, host);
    setServidores((prev) => [...prev, nuevo]);
    return nuevo;
  }, []);

  const renombrarServidor = useCallback(async (id: string, nombre: string) => {
    const actualizado = await api.renombrarServidor(id, nombre);
    setServidores((prev) => prev.map((s) => (s.id === id ? actualizado : s)));
  }, []);

  const eliminarServidor = useCallback(async (id: string) => {
    await api.eliminarServidor(id);
    setServidores((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const agregarPuerto = useCallback(async (servidorId: string, puerto: number) => {
    const actualizado = await api.agregarPuerto(servidorId, puerto);
    actualizarServidor(actualizado);
  }, [actualizarServidor]);

  const eliminarPuerto = useCallback(async (servidorId: string, puerto: number) => {
    await api.eliminarPuerto(servidorId, puerto);
    await cargar();
  }, [cargar]);

  const agregarUrl = useCallback(async (servidorId: string, url: string) => {
    await api.agregarUrl(servidorId, url);
    await cargar();
  }, [cargar]);

  const eliminarUrl = useCallback(async (servidorId: string, urlId: string) => {
    await api.eliminarUrl(servidorId, urlId);
    await cargar();
  }, [cargar]);

  return {
    servidores,
    cargando,
    error,
    actualizarServidor,
    agregarServidor,
    renombrarServidor,
    eliminarServidor,
    agregarPuerto,
    eliminarPuerto,
    agregarUrl,
    eliminarUrl,
  };
}
