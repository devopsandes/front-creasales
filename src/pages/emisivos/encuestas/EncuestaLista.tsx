// EncuestaLista.tsx — modal para cargar la lista de DNIs a los que se les muestra una encuesta.
// Sube un archivo (.xlsx, .csv o .txt, mismas reglas que el campo de DNIs de los banners) o toma los DNIs pegados.
// La lista REEMPLAZA a la anterior. Los DNIs los lee emisivos; la lista en sí nunca vuelve al front.

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { ACEPTA_DNIS, errorDeArchivoDnis } from '../bannerOpciones';
import { cargarListaPorArchivo, cargarListaPorTexto } from './encuestas.api';
import type { ResumenEncuesta } from './encuestas.api';

interface EncuestaListaProps {
  encuesta: ResumenEncuesta;
  onCerrar: () => void;
  /** Se llama cuando la lista quedó cargada, para que el listado de atrás se refresque. */
  onActualizada: () => void;
}

type ModoCarga = 'archivo' | 'texto';

const EncuestaLista = ({ encuesta, onCerrar, onActualizada }: EncuestaListaProps) => {
  const [modo, setModo] = useState<ModoCarga>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [texto, setTexto] = useState('');
  const [cantidad, setCantidad] = useState(encuesta.asignados);
  const [resumen, setResumen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const elegirArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const elegido = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!elegido) return;
    const problema = errorDeArchivoDnis(elegido);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setResumen(null);
    setArchivo(elegido);
  };

  const puedeCargar = modo === 'archivo' ? archivo !== null : texto.trim() !== '';

  const cargar = async (e: FormEvent) => {
    e.preventDefault();
    if (!puedeCargar) return;
    setCargando(true);
    setError(null);
    setResumen(null);
    try {
      const respuesta =
        modo === 'archivo' && archivo ? await cargarListaPorArchivo(encuesta.id, archivo) : await cargarListaPorTexto(encuesta.id, texto);
      setCantidad(respuesta.data?.asignados ?? cantidad);
      setResumen(respuesta.meta?.message || 'Lista cargada');
      setArchivo(null);
      setTexto('');
      onActualizada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="encuestas-modal-overlay">
      <div className="encuestas-modal" role="dialog" aria-modal="true" aria-labelledby="encuestas-lista-titulo">
        <div className="encuestas-modal-header">
          <h2 id="encuestas-lista-titulo">Lista de DNIs · Encuesta #{encuesta.id}</h2>
          <button type="button" className="encuestas-icon-btn" onClick={onCerrar} aria-label="Cerrar" disabled={cargando}>
            <FaTimes />
          </button>
        </div>

        <form className="encuestas-form" onSubmit={cargar}>
          <p className="encuestas-lista-encuesta">{encuesta.titulo}</p>
          <p className="encuestas-lista-cantidad">
            {cantidad > 0
              ? `Lista actual: ${cantidad} ${cantidad === 1 ? 'DNI' : 'DNIs'}`
              : 'Todavía no tiene lista de DNIs (sin lista no se puede activar).'}
          </p>
          <p className="encuestas-aviso">La lista reemplaza a la anterior: los DNIs que estaban y no vengan de nuevo dejan de verla.</p>

          <div className="encuestas-modo" role="group" aria-label="Cómo cargar la lista">
            {(
              [
                { valor: 'archivo', etiqueta: 'Subir un archivo' },
                { valor: 'texto', etiqueta: 'Pegar los DNIs' },
              ] as const
            ).map((opcion) => (
              <button
                type="button"
                key={opcion.valor}
                className={`encuestas-modo-opcion ${modo === opcion.valor ? 'encuestas-modo-opcion-activa' : ''}`}
                onClick={() => setModo(opcion.valor)}
                aria-pressed={modo === opcion.valor}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>

          {modo === 'archivo' ? (
            <>
              <label className="encuestas-label">
                Archivo con los DNIs <span className="encuestas-ayuda">(Excel .xlsx, .csv o .txt, hasta 20.000 DNIs)</span>
                <input className="encuestas-input" type="file" accept={ACEPTA_DNIS} onChange={elegirArchivo} />
              </label>
              {archivo && <p className="encuestas-ayuda">Archivo elegido: {archivo.name}. Los DNIs se leen al cargar la lista.</p>}
              <p className="encuestas-ayuda">
                El archivo puede ser una sola columna de DNIs, o una planilla con más columnas si la de los DNIs tiene el título
                "DNI" (también sirve "Documento" o "CUIL"): se lee solo esa columna. Le sale la encuesta a quien inicia sesión
                en la app con un DNI de la lista, sea titular o familiar.
              </p>
            </>
          ) : (
            <label className="encuestas-label">
              DNIs pegados <span className="encuestas-ayuda">(uno por línea; sirve copiar la columna de un Excel)</span>
              <textarea
                className="encuestas-input encuestas-textarea encuestas-textarea-dnis"
                rows={8}
                placeholder={'30111222\n30111223'}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setResumen(null);
                }}
              />
            </label>
          )}

          {resumen && <p className="encuestas-exito">{resumen}</p>}
          {error && <p className="encuestas-error">{error}</p>}

          <div className="encuestas-modal-acciones">
            <button type="button" className="encuestas-btn encuestas-btn-secundario" onClick={onCerrar} disabled={cargando}>
              Cerrar
            </button>
            <button type="submit" className="encuestas-btn encuestas-btn-primario" disabled={cargando || !puedeCargar}>
              <FaUpload /> {cargando ? 'Cargando...' : cantidad > 0 ? 'Reemplazar la lista' : 'Cargar la lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EncuestaLista;
