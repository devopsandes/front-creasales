// CampaniaPasoPrueba.tsx — paso 4 del asistente: la prueba obligatoria. Manda la push a DNIs/CUILs de prueba y el mail a hasta 5
// direcciones. Queda registrada con el contenido exacto: si después se cambia algo, hay que volver a mandarla.

import { useState } from 'react';
import { FaCheckCircle, FaPaperPlane, FaTimesCircle } from 'react-icons/fa';
import { mandarPrueba, obtenerCampania } from './campanias.api';
import type { Campania, ResultadoPrueba } from './campanias.api';
import { LARGOS, textoPruebaMail, textoPruebaPush } from './campaniasOpciones';
import type { EstadoPrueba } from './campaniasOpciones';

/** Cuántos destinos hay en el texto: el backend separa por espacios, comas, punto y coma o saltos de línea. */
const contar = (texto: string): number => texto.split(/[\s,;]+/).filter(Boolean).length;

interface PasoPruebaProps {
  campania: Campania;
  prueba: EstadoPrueba;
  onPrueba: (cambio: Partial<EstadoPrueba>) => void;
  onCampania: (campania: Campania) => void;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
}

const CampaniaPasoPrueba = ({ campania, prueba, onPrueba, onCampania, onAviso }: PasoPruebaProps) => {
  const [mandando, setMandando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Aviso aparte: la prueba salió bien pero no se pudo refrescar la campaña. No es un error de la prueba. */
  const [avisoRefresco, setAvisoRefresco] = useState<string | null>(null);

  const { push, mail, banner } = campania.canales;
  const faltaPush = push && prueba.destinos.trim() === '';
  const faltaMail = mail && prueba.mails.trim() === '';
  // El backend corta en silencio lo que sobra: acá se avisa antes de mandar.
  const cantidadDestinos = contar(prueba.destinos);
  const cantidadMails = contar(prueba.mails);
  const sobranDestinos = push && cantidadDestinos > LARGOS.destinosPrueba;
  const sobranMails = mail && cantidadMails > LARGOS.mailsPrueba;
  const puedeMandar = !mandando && !faltaPush && !faltaMail && !sobranDestinos && !sobranMails;

  const mandar = async () => {
    if (!puedeMandar) return;
    setMandando(true);
    setError(null);
    setAvisoRefresco(null);
    let hecha: { resultado: ResultadoPrueba; mensaje: string };
    try {
      hecha = await mandarPrueba(campania.id, prueba.destinos, prueba.mails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setMandando(false);
      return;
    }
    const { resultado, mensaje } = hecha;
    onPrueba({ resultado, mensaje });
    onAviso(resultado.pruebaVigente ? 'success' : 'error', mensaje || (resultado.pruebaVigente ? 'Prueba enviada' : 'La prueba no le llegó a nadie'));
    // La prueba ya está hecha: la vigencia sale de la propia respuesta. Después se vuelve a pedir la campaña (pruebaEnviadaAt, etc.);
    // si eso falla, no es un error de la prueba.
    onCampania({
      ...campania,
      pruebaVigente: resultado.pruebaVigente,
      pruebaEnviadaAt: resultado.pruebaVigente ? new Date().toISOString() : campania.pruebaEnviadaAt,
    });
    try {
      onCampania({ ...(await obtenerCampania(campania.id)), pruebaVigente: resultado.pruebaVigente });
    } catch {
      setAvisoRefresco('La prueba se mandó y quedó registrada, pero no pudimos refrescar los datos de la campaña (error de conexión). Cerrá la campaña y volvé a abrirla para ver el estado al día.');
    } finally {
      setMandando(false);
    }
  };

  const { resultado } = prueba;

  return (
    <div className="campanias-paso">
      <div className={`campanias-estado-prueba ${campania.pruebaVigente ? 'campanias-estado-prueba-ok' : 'campanias-estado-prueba-falta'}`}>
        {campania.pruebaVigente ? <FaCheckCircle aria-hidden="true" /> : <FaTimesCircle aria-hidden="true" />}
        <span>
          {campania.pruebaVigente
            ? 'La prueba está vigente: coincide con el contenido actual.'
            : campania.pruebaEnviadaAt
              ? 'Cambiaste algo después de la última prueba: hay que mandarla de nuevo.'
              : 'Todavía no se mandó la prueba. Sin prueba vigente no se puede enviar a todos.'}
        </span>
      </div>

      <p className="campanias-aviso">
        Si cambiás algo después de la prueba (un texto, el link, la imagen), hay que volver a mandarla. Revisá bien lo que te llega: es
        exactamente lo que va a recibir la gente.
      </p>

      {push && (
        <label className="campanias-label">
          DNIs o CUILs de prueba para la push{' '}
          <span className="campanias-ayuda">(uno por línea o separados por coma, hasta {LARGOS.destinosPrueba}; tienen que ser personas con la app)</span>
          <textarea
            className="campanias-input campanias-textarea campanias-textarea-lista"
            rows={3}
            placeholder={'30111222\n20-30111222-3'}
            value={prueba.destinos}
            onChange={(e) => onPrueba({ destinos: e.target.value })}
          />
          {sobranDestinos && (
            <span className="campanias-error">
              Pusiste {cantidadDestinos} destinos y el máximo es {LARGOS.destinosPrueba}: sacá {cantidadDestinos - LARGOS.destinosPrueba} para poder mandar la prueba.
            </span>
          )}
        </label>
      )}

      {mail && (
        <label className="campanias-label">
          Mails de prueba <span className="campanias-ayuda">(hasta {LARGOS.mailsPrueba}, separados por coma o uno por línea)</span>
          <textarea
            className="campanias-input campanias-textarea campanias-textarea-lista"
            rows={3}
            placeholder="nico.prueba@gmail.com"
            value={prueba.mails}
            onChange={(e) => onPrueba({ mails: e.target.value })}
          />
          {sobranMails && (
            <span className="campanias-error">
              Pusiste {cantidadMails} mails y el máximo es {LARGOS.mailsPrueba}: sacá {cantidadMails - LARGOS.mailsPrueba} para poder mandar la prueba.
            </span>
          )}
          <span className="campanias-ayuda">
            El mail de prueba lleva [PRUEBA] en el asunto, "Prueba" de nombre y no tiene seguimiento (no cuenta en las estadísticas).
          </span>
        </label>
      )}

      {banner && (
        <p className="campanias-ayuda campanias-ayuda-bloque">
          El banner no se prueba: se crea en la pestaña Banner cuando enviás a todos. Podés verlo en la vista previa del paso 2.
        </p>
      )}

      {error && <p className="campanias-error">{error}</p>}
      {avisoRefresco && <p className="campanias-aviso">{avisoRefresco}</p>}

      <div className="campanias-modal-acciones campanias-acciones-izquierda">
        <button type="button" className="campanias-btn campanias-btn-primario" onClick={() => void mandar()} disabled={!puedeMandar}>
          <FaPaperPlane /> {mandando ? 'Mandando...' : 'Mandar prueba'}
        </button>
      </div>

      {resultado && (
        <div className="campanias-resultado-prueba" aria-live="polite">
          {resultado.push && resultado.push.length > 0 && (
            <div>
              <span className="campanias-sublabel">Push</span>
              <ul className="campanias-lista-prueba">
                {resultado.push.map((fila, indice) => {
                  const { texto, bien } = textoPruebaPush(fila.estado);
                  return (
                    <li key={`${fila.destino}-${indice}`} className={bien ? 'campanias-prueba-bien' : 'campanias-prueba-mal'}>
                      <strong>{fila.destino}</strong>
                      <span>{texto}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {resultado.mail && resultado.mail.length > 0 && (
            <div>
              <span className="campanias-sublabel">Mail</span>
              <ul className="campanias-lista-prueba">
                {resultado.mail.map((fila, indice) => {
                  const { texto, bien } = textoPruebaMail(fila.estado);
                  return (
                    <li key={`${fila.destino}-${indice}`} className={bien ? 'campanias-prueba-bien' : 'campanias-prueba-mal'}>
                      <strong>{fila.destino}</strong>
                      <span>
                        {texto}
                        {fila.detalle ? ` (${fila.detalle})` : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {prueba.mensaje && <p className={resultado.pruebaVigente ? 'campanias-exito' : 'campanias-error'}>{prueba.mensaje}</p>}
        </div>
      )}
    </div>
  );
};

export default CampaniaPasoPrueba;
