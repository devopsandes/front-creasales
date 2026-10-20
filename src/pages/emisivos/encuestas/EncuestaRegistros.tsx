// EncuestaRegistros.tsx — tabla de registros de una encuesta pública (dentro de Resultados): quién respondió, si el mail le llegó
// y el "Estado" que carga marketing (Pendiente / Contactado / Canjeado / No responde). De a 50, los más nuevos primero.

import { useEffect, useState } from 'react';
import { fechaCortaMendoza } from '../campanias/informeCampania';
import { cambiarEstadoRegistro, listarRegistrosPublicos } from './encuestas.api';
import type { EstadoMarketing, FiltroRegistros, PaginaRegistros, RegistroPublico } from './encuestas.api';
import { ESTADOS_MARKETING, FILTROS_REGISTROS, textoMailEstado } from './encuestasOpciones';

interface EncuestaRegistrosProps {
  encuestaId: number;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
  /** Se llama cuando cambió el estado de un registro, para refrescar las cifras de arriba. */
  onEstadoCambiado: () => void;
}

/** Lo último que llegó del servidor y para qué consulta. Si la clave no es la de la consulta actual, se está cargando. */
interface Cargado {
  clave: string;
  pagina: PaginaRegistros | null;
  error: string | null;
}

const ESPERA_BUSQUEDA_MS = 400;

const EncuestaRegistros = ({ encuestaId, onAviso, onEstadoCambiado }: EncuestaRegistrosProps) => {
  const [filtro, setFiltro] = useState<FiltroRegistros>('todas');
  const [estado, setEstado] = useState<EstadoMarketing | ''>('');
  const [busqueda, setBusqueda] = useState('');
  // Lo que se busca de verdad: la caja de texto espera un ratito a que termines de escribir para no pedir en cada tecla.
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargado, setCargado] = useState<Cargado | null>(null);
  /** Cambios de estado hechos en pantalla (id → estado), encima de lo que trajo el servidor, mientras se guardan o hasta recargar. */
  const [cambios, setCambios] = useState<Record<number, EstadoMarketing>>({});
  const [guardando, setGuardando] = useState<number[]>([]);

  const clave = `${encuestaId}|${filtro}|${estado}|${q}|${pagina}`;
  const cargando = cargado?.clave !== clave;

  useEffect(() => {
    const espera = setTimeout(() => {
      setQ(busqueda);
      setPagina(1);
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [busqueda]);

  useEffect(() => {
    let vigente = true; // si cambia el filtro o se cierra el modal antes de que llegue la respuesta, no se pisa lo que se ve
    listarRegistrosPublicos(encuestaId, { filtro, estado, q, pagina })
      .then((datos) => {
        if (!vigente) return;
        setCambios({});
        setCargado({ clave, pagina: datos, error: null });
      })
      .catch((err: unknown) => {
        if (vigente) setCargado({ clave, pagina: null, error: err instanceof Error ? err.message : 'Error de conexión' });
      });
    return () => {
      vigente = false;
    };
  }, [clave, encuestaId, filtro, estado, q, pagina]);

  const cambiarFiltro = (nuevo: FiltroRegistros) => {
    setFiltro(nuevo);
    setPagina(1);
  };

  const cambiarEstadoFiltro = (nuevo: EstadoMarketing | '') => {
    setEstado(nuevo);
    setPagina(1);
  };

  /** Cambia el estado en pantalla enseguida y lo guarda; si el servidor lo rechaza, vuelve al que tenía. */
  const cambiarEstado = async (registro: RegistroPublico, nuevo: EstadoMarketing) => {
    const anterior = cambios[registro.id] ?? registro.estado;
    if (nuevo === anterior) return;
    setCambios((prev) => ({ ...prev, [registro.id]: nuevo }));
    setGuardando((prev) => [...prev, registro.id]);
    try {
      await cambiarEstadoRegistro(encuestaId, registro.id, nuevo);
      onEstadoCambiado();
    } catch (err) {
      setCambios((prev) => ({ ...prev, [registro.id]: anterior }));
      onAviso('error', err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    } finally {
      setGuardando((prev) => prev.filter((id) => id !== registro.id));
    }
  };

  const datos = cargado?.pagina ?? null;
  const filas = datos?.filas ?? [];
  const total = datos?.total ?? 0;
  const porPagina = datos?.porPagina ?? 50;
  const paginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <section className="encuestas-registros">
      <h3 className="encuestas-resultado-titulo">Registros</h3>

      <div className="encuestas-registros-filtros">
        <div className="encuestas-modo" role="group" aria-label="Filtrar los registros">
          {FILTROS_REGISTROS.map((opcion) => (
            <button
              type="button"
              key={opcion.valor}
              className={`encuestas-modo-opcion ${filtro === opcion.valor ? 'encuestas-modo-opcion-activa' : ''}`}
              onClick={() => cambiarFiltro(opcion.valor)}
              aria-pressed={filtro === opcion.valor}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
        <select
          className="encuestas-input"
          value={estado}
          onChange={(e) => cambiarEstadoFiltro(e.target.value as EstadoMarketing | '')}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_MARKETING.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
        <input
          className="encuestas-input encuestas-registros-busqueda"
          type="search"
          placeholder="Buscar por nombre, WhatsApp o email"
          aria-label="Buscar registros"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargado?.error && <p className="encuestas-error">{cargado.error}</p>}
      {cargando && !cargado?.error && <p className="encuestas-estado">Cargando registros...</p>}

      {!cargando && !cargado?.error && filas.length === 0 && <p className="encuestas-estado">No hay registros con ese filtro.</p>}

      {filas.length > 0 && (
        <div className="encuestas-tabla-marco" aria-busy={cargando}>
          <table className="encuestas-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>Mail</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((registro) => {
                const estadoActual = cambios[registro.id] ?? registro.estado;
                return (
                  <tr key={registro.id}>
                    <td className="encuestas-tabla-fecha">{fechaCortaMendoza(registro.createdAt)}</td>
                    <td>
                      {registro.nombre}
                      {registro.duplicada && <span className="encuestas-chip-duplicado">Duplicado</span>}
                    </td>
                    <td>{registro.whatsapp}</td>
                    <td className="encuestas-tabla-email">{registro.email}</td>
                    <td>
                      <span className={`encuestas-mail-estado encuestas-mail-estado-${registro.mailEstado}`}>{textoMailEstado(registro.mailEstado)}</span>
                    </td>
                    <td>
                      <select
                        className="encuestas-input encuestas-tabla-estado"
                        value={estadoActual}
                        disabled={guardando.includes(registro.id)}
                        onChange={(e) => void cambiarEstado(registro, e.target.value as EstadoMarketing)}
                        aria-label={`Estado de ${registro.nombre}`}
                      >
                        {ESTADOS_MARKETING.map((opcion) => (
                          <option key={opcion} value={opcion}>
                            {opcion}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="encuestas-paginado">
          <span className="encuestas-ayuda">
            {total.toLocaleString('es-AR')} {total === 1 ? 'registro' : 'registros'} · página {pagina} de {paginas}
          </span>
          <div className="encuestas-paginado-botones">
            <button
              type="button"
              className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
              onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
              disabled={pagina <= 1 || cargando}
            >
              Anterior
            </button>
            <button
              type="button"
              className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
              onClick={() => setPagina((actual) => Math.min(paginas, actual + 1))}
              disabled={pagina >= paginas || cargando}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default EncuestaRegistros;
