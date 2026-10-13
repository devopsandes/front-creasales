// CampaniaContenidoPush.tsx — contenido de la push de la campaña, con vista previa tipo notificación de celular.

import carita from '../carita-andes.png';
import CampaniaContador from './CampaniaContador';
import type { DatosFormularioCampania } from './campanias.api';
import { LARGOS, esLinkDeCampania } from './campaniasOpciones';

interface ContenidoPushProps {
  push: DatosFormularioCampania['push'];
  onCambiar: (cambio: Partial<DatosFormularioCampania['push']>) => void;
  deshabilitado: boolean;
}

const CampaniaContenidoPush = ({ push, onCambiar, deshabilitado }: ContenidoPushProps) => {
  const link = push.link.trim();
  const linkInvalido = link !== '' && !esLinkDeCampania(link);

  return (
    <div className="campanias-seccion-columnas">
      <div className="campanias-seccion-campos">
        <label className="campanias-label">
          <span className="campanias-label-linea">
            Título <CampaniaContador valor={push.titulo} maximo={LARGOS.pushTitulo} />
          </span>
          <input
            className="campanias-input"
            value={push.titulo}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ titulo: e.target.value })}
          />
        </label>

        <label className="campanias-label">
          <span className="campanias-label-linea">
            Texto <CampaniaContador valor={push.cuerpo} maximo={LARGOS.pushCuerpo} />
          </span>
          <textarea
            className="campanias-input campanias-textarea"
            rows={4}
            value={push.cuerpo}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ cuerpo: e.target.value })}
          />
        </label>

        <label className="campanias-label">
          Link <span className="campanias-ayuda">(opcional: se abre al tocar la notificación)</span>
          <input
            className="campanias-input"
            type="url"
            placeholder="https://"
            value={push.link}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ link: e.target.value })}
          />
        </label>
        {linkInvalido && (
          <p className="campanias-aviso">
            El link tiene que ser https de andessalud.com.ar o andessalud.ar, o un WhatsApp de Argentina (https://wa.me/54...). Si no, no se
            va a poder guardar.
          </p>
        )}
      </div>

      <div className="campanias-seccion-preview">
        <span className="campanias-sublabel">Así se ve en el celular</span>
        <div className="campanias-notificacion" aria-label="Vista previa de la notificación">
          <img className="campanias-notificacion-icono" src={carita} alt="" />
          <div className="campanias-notificacion-texto">
            <div className="campanias-notificacion-app">
              <span>Andes Salud</span>
              <span>ahora</span>
            </div>
            <strong className={push.titulo.trim() ? '' : 'campanias-vacio'}>{push.titulo.trim() || 'Título de la push'}</strong>
            <span className={push.cuerpo.trim() ? '' : 'campanias-vacio'}>{push.cuerpo.trim() || 'Acá va el texto de la push.'}</span>
          </div>
        </div>
        <p className="campanias-ayuda">Aproximada: cada celular la muestra a su manera y corta el texto largo.</p>
      </div>
    </div>
  );
};

export default CampaniaContenidoPush;
