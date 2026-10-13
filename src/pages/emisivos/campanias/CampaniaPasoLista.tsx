// CampaniaPasoLista.tsx — paso 3 del asistente: subir o pegar la lista de destinatarios, ver el avance mientras emisivos la
// procesa (cruza con el padrón y con las cuentas de la app), leer el resumen y editar la lista (CampaniaListaEditable).

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FaUpload } from 'react-icons/fa';
import { cargarListaArchivo, cargarListaTexto } from './campanias.api';
import type { Campania } from './campanias.api';
import { ACEPTA_LISTA, anchoBarra, errorDeArchivoLista, lineasResumen, numero } from './campaniasOpciones';
import { useConfirmacion } from '../useConfirmacion';
import CampaniaListaEditable from './CampaniaListaEditable';

interface PasoListaProps {
  campania: Campania;
  /** Se llama con la campaña que devuelve emisivos al empezar a procesar la lista (el asistente se queda mirando el avance). */
  onCampania: (campania: Campania) => void;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
}

type ModoCarga = 'archivo' | 'texto';

const CampaniaPasoLista = ({ campania, onCampania, onAviso }: PasoListaProps) => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [modo, setModo] = useState<ModoCarga>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const procesando = campania.estado === 'PROCESANDO_LISTA';
  const esAfiliados = campania.tipoDestinatario === 'afiliados';
  const tieneLista = campania.resumen !== null && campania.resumen !== undefined;
  const puedeCargar = !procesando && (modo === 'archivo' ? archivo !== null : texto.trim() !== '');

  const elegirArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const elegido = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!elegido) return;
    const problema = errorDeArchivoLista(elegido);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setArchivo(elegido);
  };

  const cargar = async (e: FormEvent) => {
    e.preventDefault();
    if (!puedeCargar) return;
    if (
      tieneLista &&
      !(await confirmar({
        titulo: 'Reemplazar la lista',
        mensaje: 'La lista nueva reemplaza a la que ya está cargada. La prueba sigue valiendo (valida el contenido, no la lista).',
        textoConfirmar: 'Reemplazar',
      }))
    ) return;
    setCargando(true);
    setError(null);
    try {
      const respuesta = modo === 'archivo' && archivo ? await cargarListaArchivo(campania.id, archivo) : await cargarListaTexto(campania.id, texto);
      if (respuesta.data) onCampania(respuesta.data);
      onAviso('success', respuesta.meta?.message || 'Procesando la lista');
      setArchivo(null);
      setTexto('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const progreso = campania.progresoLista;
  const hechos = progreso?.hechos ?? 0;
  const total = progreso?.total ?? 0;
  const resumen = campania.resumen;

  return (
    <div className="campanias-paso">
      {ventanaConfirmacion}
      {procesando && (
        <div className="campanias-procesando" role="status">
          <strong>Procesando la lista...</strong>
          <div
            className="campanias-barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={anchoBarra(hechos, total)}
            aria-label="Avance de la lista"
          >
            <div className="campanias-barra-relleno" style={{ width: `${anchoBarra(hechos, total)}%` }} />
          </div>
          <span className="campanias-ayuda">
            {numero(hechos)} de {numero(total)} {esAfiliados ? '(se cruza cada persona con el padrón de Andes, puede tardar unos minutos)' : ''}
          </span>
        </div>
      )}

      {!procesando && campania.errorLista && <p className="campanias-error">{campania.errorLista}</p>}

      {campania.estado === 'LISTA' && resumen && (
        <div className="campanias-resumen">
          <strong>Lista cargada</strong>
          <ul className="campanias-chips-resumen">
            {lineasResumen(resumen, campania.tipoDestinatario).map((linea) => (
              <li key={linea} className="campanias-chip-resumen">
                {linea}
              </li>
            ))}
          </ul>
          {resumen.vigentes === 0 && (
            <p className="campanias-aviso">
              {resumen.quitados
                ? 'No quedó nadie vigente: con esta lista no se puede enviar. Volvé a poner a alguien de los quitados, agregá personas o cargá otra lista.'
                : 'No quedó nadie vigente: con esta lista no se puede enviar. Agregá personas o cargá otra lista.'}
            </p>
          )}
        </div>
      )}

      {campania.estado === 'LISTA' && resumen && <CampaniaListaEditable campania={campania} onCampania={onCampania} onAviso={onAviso} />}

      <form className="campanias-paso" onSubmit={cargar}>
        <p className="campanias-ayuda campanias-ayuda-bloque">
          La lista que subas <strong>reemplaza</strong> a la anterior. Se leen estas columnas por su título: <strong>DNI</strong> (o Documento),{' '}
          <strong>CUIL</strong> (o CUIT), <strong>Mail</strong> (o Correo) y <strong>Nombre</strong> (o Apellido). Si no tiene títulos, tiene
          que ser una sola columna que puede mezclar DNIs, CUILs y mails. Se descartan las filas inválidas y los repetidos, y los mails mal
          escritos (dominio mal tipeado, con ñ, de relleno) se descartan y quedan contados en el resumen.{' '}
          {esAfiliados
            ? 'Cada persona se cruza con el padrón de Andes: los que están de baja o no figuran no reciben nada, y de ahí salen el CUIL, el mail (si la lista no lo trae), el nombre del saludo y si es titular o familiar.'
            : 'A los prestadores la lista se les usa tal cual, así que cada fila necesita su mail.'}
        </p>

        <div className="campanias-modo" role="group" aria-label="Cómo cargar la lista">
          {(
            [
              { valor: 'archivo', etiqueta: 'Subir un archivo' },
              { valor: 'texto', etiqueta: 'Pegar la lista' },
            ] as const
          ).map((opcion) => (
            <button
              type="button"
              key={opcion.valor}
              className={`campanias-modo-opcion ${modo === opcion.valor ? 'campanias-modo-opcion-activa' : ''}`}
              onClick={() => setModo(opcion.valor)}
              aria-pressed={modo === opcion.valor}
              disabled={procesando}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        {modo === 'archivo' ? (
          <>
            <label className="campanias-label">
              Archivo con la lista <span className="campanias-ayuda">(Excel .xlsx, .csv o .txt, hasta 5 MB)</span>
              <input className="campanias-input" type="file" accept={ACEPTA_LISTA} onChange={elegirArchivo} disabled={procesando} />
            </label>
            {archivo && <p className="campanias-ayuda">Archivo elegido: {archivo.name}. Se lee al cargar la lista.</p>}
          </>
        ) : (
          <label className="campanias-label">
            Lista pegada <span className="campanias-ayuda">(una persona por línea; sirve copiar y pegar desde un Excel, con los títulos)</span>
            <textarea
              className="campanias-input campanias-textarea campanias-textarea-lista"
              rows={8}
              placeholder={'DNI;Mail\n30111222;juan@gmail.com\n30111223;'}
              value={texto}
              disabled={procesando}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>
        )}

        {error && <p className="campanias-error">{error}</p>}

        <div className="campanias-modal-acciones">
          <button type="submit" className="campanias-btn campanias-btn-primario" disabled={cargando || !puedeCargar}>
            <FaUpload /> {cargando ? 'Enviando...' : tieneLista ? 'Reemplazar la lista' : 'Cargar la lista'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaniaPasoLista;
