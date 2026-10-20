// EncuestaFormAccion.tsx — sección "Acción al contestar la encuesta" del formulario de encuestas: el mail a quien responde (solo
// en las públicas, con su prueba) y el aviso por mail a marketing cada vez que alguien responde. Nada de esto se ve en la app ni en la web.

import { useEffect, useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { opcionesCampanias } from '../campanias/campanias.api';
import { REMITENTES_POR_DEFECTO } from '../campanias/campaniasOpciones';
import EncuestaMailEditor from './EncuestaMailEditor';
import type { CambioImagenMail } from './EncuestaMailEditor';
import { listaDeMails, mandarPruebaMail, urlImagenMail } from './encuestas.api';
import type { DatosFormularioEncuesta, Encuesta, MailFormulario, ResultadoPruebaMail } from './encuestas.api';
import { MAX_AVISOS } from './encuestasOpciones';

interface EncuestaFormAccionProps {
  datos: DatosFormularioEncuesta;
  onCambiar: (cambio: Partial<DatosFormularioEncuesta>) => void;
  onCambiarMail: (cambio: Partial<MailFormulario>) => void;
  /** La encuesta tal como vino del servidor al abrir el formulario (null = nueva). */
  encuesta: Encuesta | null;
  /** Id de la encuesta ya guardada (la que se abrió, o la que se creó recién), o null si todavía no existe. */
  idGuardada: number | null;
  /** ¿El formulario tiene cambios que no se guardaron? La prueba usa lo guardado, no lo que está en pantalla. */
  hayCambios: boolean;
  imagen: CambioImagenMail;
  onImagen: (cambio: CambioImagenMail) => void;
  /** Cambia en cada guardado para que el navegador no muestre una imagen vieja. */
  versionImagen: number;
  onError: (mensaje: string) => void;
  deshabilitado: boolean;
}

const EncuestaFormAccion = ({
  datos,
  onCambiar,
  onCambiarMail,
  encuesta,
  idGuardada,
  hayCambios,
  imagen,
  onImagen,
  versionImagen,
  onError,
  deshabilitado,
}: EncuestaFormAccionProps) => {
  const publica = datos.audiencia === 'publica';
  const [remitentes, setRemitentes] = useState<string[]>([]);
  const [urlImagenNueva, setUrlImagenNueva] = useState<string | null>(null);
  const [mailsPrueba, setMailsPrueba] = useState('');
  const [mandando, setMandando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<ResultadoPruebaMail[] | null>(null);
  const [errorPrueba, setErrorPrueba] = useState<string | null>(null);

  // Remitentes permitidos: los del backend de Campañas. Si no responde, se quedan los de siempre y el backend valida igual al guardar.
  useEffect(() => {
    if (!publica) return;
    let vigente = true;
    opcionesCampanias()
      .then((opciones) => {
        if (vigente) setRemitentes(opciones.remitentes);
      })
      .catch(() => {
        // sin respuesta: el combo usa los remitentes por defecto
      });
    return () => {
      vigente = false;
    };
  }, [publica]);

  // Vista previa de la imagen elegida: se libera al cambiarla o al cerrar el formulario.
  useEffect(() => {
    if (!imagen.archivo) {
      setUrlImagenNueva(null);
      return;
    }
    const url = URL.createObjectURL(imagen.archivo);
    setUrlImagenNueva(url);
    return () => URL.revokeObjectURL(url);
  }, [imagen.archivo]);

  const tieneImagenGuardada = Boolean(encuesta?.tieneImagenMail);
  const imagenGuardada = idGuardada && tieneImagenGuardada && !imagen.quitar ? urlImagenMail(idGuardada, versionImagen) : null;
  const imagenVista = urlImagenNueva ?? imagenGuardada;

  const prenderMail = (activo: boolean) => {
    // Al prenderlo por primera vez ya queda elegido el primer remitente.
    const primero = remitentes[0] ?? REMITENTES_POR_DEFECTO[0];
    onCambiar({ mailPersonaActivo: activo });
    if (activo && !datos.mail.remitente) onCambiarMail({ remitente: primero });
  };

  const mailsAviso = listaDeMails(datos.avisos);
  const mailsDePrueba = listaDeMails(mailsPrueba);
  const sobranPrueba = mailsDePrueba.length > MAX_AVISOS;
  const puedeProbar = idGuardada !== null && !hayCambios && mailsDePrueba.length > 0 && !sobranPrueba && !mandando && !deshabilitado;

  const probar = async () => {
    if (idGuardada === null || !puedeProbar) return;
    setMandando(true);
    setErrorPrueba(null);
    setResultadoPrueba(null);
    try {
      setResultadoPrueba(await mandarPruebaMail(idGuardada, mailsDePrueba));
    } catch (err) {
      setErrorPrueba(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setMandando(false);
    }
  };

  return (
    <fieldset className="encuestas-fieldset" disabled={deshabilitado}>
      <legend>Acción al contestar la encuesta</legend>
      <p className="encuestas-ayuda">
        Lo que pasa cuando alguien la responde. Esto lo ve solo el equipo: no aparece en la app ni en la web.
      </p>

      {publica && (
        <div className="encuestas-accion">
          <label className="encuestas-check">
            <input type="checkbox" checked={datos.mailPersonaActivo} onChange={(e) => prenderMail(e.target.checked)} />
            Enviar un mail a quien responde
          </label>
          {!datos.mailPersonaActivo && (
            <p className="encuestas-ayuda">
              Por ejemplo, el mail con el descuento. No se manda a las respuestas duplicadas (mismo email o WhatsApp que una anterior).
            </p>
          )}

          {datos.mailPersonaActivo && (
            <>
              <EncuestaMailEditor
                mail={datos.mail}
                onCambiar={onCambiarMail}
                remitentes={remitentes}
                imagenVista={imagenVista}
                tieneImagenGuardada={tieneImagenGuardada}
                onImagen={onImagen}
                onError={onError}
                deshabilitado={deshabilitado}
              />

              <div className="encuestas-prueba">
                <span className="encuestas-subtitulo">Mandar una prueba</span>
                <label className="encuestas-label">
                  Mails de prueba <span className="encuestas-ayuda">(hasta {MAX_AVISOS}, separados por coma)</span>
                  <input
                    className="encuestas-input"
                    type="text"
                    placeholder="nico.prueba@gmail.com"
                    value={mailsPrueba}
                    onChange={(e) => setMailsPrueba(e.target.value)}
                  />
                </label>
                {sobranPrueba && (
                  <p className="encuestas-error">
                    Pusiste {mailsDePrueba.length} mails y el máximo es {MAX_AVISOS}: sacá {mailsDePrueba.length - MAX_AVISOS} para poder
                    mandar la prueba.
                  </p>
                )}
                {idGuardada === null ? (
                  <p className="encuestas-aviso">
                    Guardá antes de probar. La prueba manda el mail guardado: guardá la encuesta y volvé a abrirla con "Editar" para
                    mandarla.
                  </p>
                ) : (
                  hayCambios && (
                    <p className="encuestas-aviso">
                      Guardá antes de probar. Hay cambios sin guardar y la prueba manda el mail tal como quedó guardado.
                    </p>
                  )
                )}
                <button
                  type="button"
                  className="encuestas-btn encuestas-btn-secundario encuestas-btn-agregar"
                  onClick={() => void probar()}
                  disabled={!puedeProbar}
                >
                  <FaPaperPlane /> {mandando ? 'Mandando...' : 'Mandar prueba'}
                </button>
                <p className="encuestas-ayuda">El mail de prueba lleva [PRUEBA] en el asunto y "Prueba" de nombre.</p>
                {errorPrueba && <p className="encuestas-error">{errorPrueba}</p>}
                {resultadoPrueba && (
                  <ul className="encuestas-prueba-resultado" aria-live="polite">
                    {resultadoPrueba.map((fila, indice) => (
                      <li key={`${fila.mail}-${indice}`} className={fila.ok ? 'encuestas-prueba-bien' : 'encuestas-prueba-mal'}>
                        <strong>{fila.mail}</strong>
                        <span>
                          {fila.ok ? 'Enviado: revisá la bandeja (y el spam)' : `No se pudo mandar${fila.error ? ` (${fila.error})` : ''}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {publica && (
        <div className="encuestas-accion">
          <label className="encuestas-check">
            <input type="checkbox" checked={datos.avisosActivo} onChange={(e) => onCambiar({ avisosActivo: e.target.checked })} />
            Avisar por mail cada vez que alguien responde
          </label>
          {datos.avisosActivo && (
            <label className="encuestas-label">
              Mails a los que se avisa <span className="encuestas-ayuda">(hasta {MAX_AVISOS}, separados por coma)</span>
              <input
                className="encuestas-input"
                type="text"
                placeholder="ruy.machado@andessalud.ar"
                value={datos.avisos}
                onChange={(e) => onCambiar({ avisos: e.target.value })}
              />
              <span className="encuestas-ayuda">
                ej.: ruy.machado@andessalud.ar. Llega un mail por cada respuesta que entra.
                {mailsAviso.length > MAX_AVISOS ? ` Pusiste ${mailsAviso.length}: el máximo es ${MAX_AVISOS}.` : ''}
              </span>
            </label>
          )}
        </div>
      )}
    </fieldset>
  );
};

export default EncuestaFormAccion;
