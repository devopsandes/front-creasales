// useListaPersonas.ts — lo que comparten las dos tablas de personas de una campaña: la del paso Destinatarios
// (CampaniaListaEditable, editable) y la de Estadísticas (CampaniaPersonas, solo lectura). Buscador con espera, filtro,
// paginado de a 50, descarte de respuestas viejas y vuelta a la última página con gente.

import { useCallback, useEffect, useRef, useState } from 'react';
import { listarDestinatarios } from './campanias.api';
import type { DestinatarioFila, FiltroLista } from './campanias.api';

const ESPERA_BUSCADOR_MS = 300;

/**
 * @param campaniaId la campaña
 * @param disparador cualquier valor que, al cambiar, vuelve a pedir la página (updatedAt de la campaña, la hora de las
 *        estadísticas, un contador de acciones...)
 */
export const useListaPersonas = (campaniaId: number, disparador: unknown) => {
  const [buscarEscrito, setBuscarEscrito] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltroElegido] = useState<FiltroLista>('todos');
  const [pagina, setPagina] = useState(1);
  const [filas, setFilas] = useState<DestinatarioFila[]>([]);
  const [total, setTotal] = useState(0);
  const [porPagina, setPorPagina] = useState(50);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);

  // El buscador espera a que se deje de escribir para no pedir la lista en cada tecla.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBuscar(buscarEscrito.trim());
      setPagina(1);
    }, ESPERA_BUSCADOR_MS);
    return () => clearTimeout(temporizador);
  }, [buscarEscrito]);

  // Cada pedido lleva un número: si llega la respuesta de un filtro o búsqueda anterior, se descarta (no pisa la tabla).
  const ultimoPedido = useRef(0);

  const cargar = useCallback(async () => {
    const pedido = ++ultimoPedido.current;
    setCargando(true);
    try {
      const resultado = await listarDestinatarios(campaniaId, buscar, filtro, pagina);
      if (pedido !== ultimoPedido.current) return;
      // Si se quitó al último de la última página (con un filtro), se vuelve a la última que tiene gente.
      const ultimaPagina = Math.max(1, Math.ceil(resultado.total / resultado.porPagina));
      if (pagina > ultimaPagina) {
        setPagina(ultimaPagina);
        return;
      }
      setFilas(resultado.filas);
      setTotal(resultado.total);
      setPorPagina(resultado.porPagina);
      setError(null);
    } catch (err) {
      if (pedido === ultimoPedido.current) setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      if (pedido === ultimoPedido.current) setCargando(false);
    }
  }, [campaniaId, buscar, filtro, pagina]);

  // `recargas`: después de una acción se pide de nuevo aunque el disparador no haya cambiado (updatedAt tiene
  // precisión de 1 segundo y dos cambios seguidos pueden dejarlo igual).
  useEffect(() => {
    void cargar();
  }, [cargar, disparador, recargas]);

  const setFiltro = (nuevo: FiltroLista) => {
    setFiltroElegido(nuevo);
    setPagina(1);
  };

  return {
    buscarEscrito,
    setBuscarEscrito,
    buscar,
    filtro,
    setFiltro,
    pagina,
    setPagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
    filas,
    total,
    cargando,
    error,
    recargar: () => setRecargas((n) => n + 1),
  };
};
