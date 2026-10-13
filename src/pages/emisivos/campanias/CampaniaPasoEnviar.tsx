// CampaniaPasoEnviar.tsx — paso 5 del asistente: resumen final y "Enviar a todos". Exige la prueba vigente y que quien envía
// confirme que la revisó.

import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { enviarCampania } from './campanias.api';
import type { Campania } from './campanias.api';
import { numero } from './campaniasOpciones';
import { useConfirmacion } from '../useConfirmacion';

interface PasoEnviarProps {
  campania: Campania;
  /** Se llama cuando emisivos aceptó el envío (la campaña ya está en ENVIANDO). */
  onEnviada: (campania: Campania) => void;
}

const CampaniaPasoEnviar = ({ campania, onEnviada }: PasoEnviarProps) => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [reviso, setReviso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumen = campania.resumen;
  const vigentes = resumen?.vigentes ?? 0;
  const { push, mail, banner } = campania.canales;

  const motivoBloqueo = !campania.pruebaVigente
    ? campania.pruebaEnviadaAt
      ? 'Cambiaste algo después de la prueba: volvé al paso 4 y mandala de nuevo.'
      : 'Falta mandar la prueba: hacelo en el paso 4.'
    : campania.estado !== 'LISTA'
      ? 'La campaña tiene que tener la lista cargada y no haberse enviado.'
      : vigentes === 0
        ? 'La lista no tiene destinatarios vigentes.'
        : null;

  const enviar = async () => {
    const confirmado = await confirmar({
      titulo: 'Enviar a todos',
      mensaje:
        `Vas a enviar "${campania.nombre}" a ${numero(vigentes)} ${vigentes === 1 ? 'persona' : 'personas'}. ` +
        'Podés pausarla o cancelarla, pero lo que ya salió no se puede retirar.',
      textoConfirmar: 'Enviar a todos',
    });
    if (!confirmado) return;
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await enviarCampania(campania.id);
      if (respuesta.data) onEnviada(respuesta.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setEnviando(false);
    }
  };

  return (
    <div className="campanias-paso">
      {ventanaConfirmacion}
      <div className="campanias-resumen">
        <strong>Resumen final</strong>
        <p className="campanias-resumen-nombre">{campania.nombre}</p>
        <ul className="campanias-llegada">
          <li>
            <span className="campanias-llegada-numero">{numero(vigentes)}</span>
            <span>
              {vigentes === 1 ? 'persona vigente' : 'personas vigentes'}
              {campania.tipoDestinatario === 'afiliados' ? ' (afiliados que están en el padrón)' : ' (prestadores de la lista)'}
            </span>
          </li>
          {push && (
            <li>
              <span className="campanias-llegada-numero">{numero(resumen?.conCuil ?? 0)}</span>
              <span>
                reciben la <strong>push</strong> (los vigentes con CUIL). Tienen la app {numero(resumen?.conApp ?? 0)}: a esos les llega al
                celular; a quien tiene cuenta pero sin celular registrado le queda en el buzón.
              </span>
            </li>
          )}
          {mail && (
            <li>
              <span className="campanias-llegada-numero">{numero(resumen?.conMailValido ?? 0)}</span>
              <span>
                reciben el <strong>mail</strong> ({numero(resumen?.sinMail ?? 0)} no, por no tener mail válido o no querer recibirlos).
                Salen de a uno: unos 1.800 por hora.
              </span>
            </li>
          )}
          {banner && (
            <li>
              <span className="campanias-llegada-numero">{numero(vigentes)}</span>
              <span>
                ven el <strong>banner</strong> en el Home de la app (7.1.4 o más nueva). Se crea en la pestaña Banner al enviar.
              </span>
            </li>
          )}
        </ul>
      </div>

      <label className="campanias-check campanias-check-grande">
        <input type="checkbox" checked={reviso} onChange={(e) => setReviso(e.target.checked)} disabled={enviando} />
        Revisé la prueba y está bien
      </label>

      {motivoBloqueo && <p className="campanias-aviso">{motivoBloqueo}</p>}
      {error && <p className="campanias-error">{error}</p>}

      <div className="campanias-modal-acciones campanias-acciones-izquierda">
        <button
          type="button"
          className="campanias-btn campanias-btn-primario"
          onClick={() => void enviar()}
          disabled={enviando || !reviso || motivoBloqueo !== null}
        >
          <FaPaperPlane /> {enviando ? 'Enviando...' : 'Enviar a todos'}
        </button>
      </div>
    </div>
  );
};

export default CampaniaPasoEnviar;
