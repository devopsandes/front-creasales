// CampaniaContenidoBanner.tsx — contenido del banner de la campaña. Mismos campos y reglas que la pestaña Banner, pero sin
// lista de DNIs ni segmentación: le sale a los DNIs vigentes de la lista de la campaña. El banner se crea al enviar a todos.

import { useState } from 'react';
import BannerPreview from '../BannerPreview';
import SelectorPantalla from '../SelectorPantalla';
import {
  LARGOS as LARGOS_BANNER,
  LARGO_MENSAJE_WHATSAPP,
  PLANTILLAS,
  armarLinkWhatsApp,
  esLinkWhatsApp,
  leerLinkWhatsApp,
  linkLoAbreLaApp,
} from '../bannerOpciones';
import CampaniaContador from './CampaniaContador';
import type { DatosFormularioCampania } from './campanias.api';

interface ContenidoBannerProps {
  banner: DatosFormularioCampania['banner'];
  onCambiar: (cambio: Partial<DatosFormularioCampania['banner']>) => void;
  deshabilitado: boolean;
}

type AccionBanner = 'nada' | 'link' | 'whatsapp' | 'pantalla';

const ACCIONES: { valor: AccionBanner; etiqueta: string }[] = [
  { valor: 'nada', etiqueta: 'Nada' },
  { valor: 'link', etiqueta: 'Abrir un link de Andes' },
  { valor: 'whatsapp', etiqueta: 'Abrir un WhatsApp' },
  { valor: 'pantalla', etiqueta: 'Abrir una pantalla de la app' },
];

const esLinkWa = (link: string) => link.startsWith('https://wa.me/');

const CampaniaContenidoBanner = ({ banner, onCambiar, deshabilitado }: ContenidoBannerProps) => {
  const [accion, setAccion] = useState<AccionBanner>(() =>
    banner.pantalla ? 'pantalla' : esLinkWa(banner.linkUrl) ? 'whatsapp' : banner.linkUrl ? 'link' : 'nada',
  );
  const [whatsapp, setWhatsapp] = useState(() => (esLinkWa(banner.linkUrl) ? leerLinkWhatsApp(banner.linkUrl) : { numero: '', mensaje: '' }));

  const cambiarWhatsapp = (campo: 'numero' | 'mensaje', valor: string) => {
    const nuevo = { ...whatsapp, [campo]: valor };
    setWhatsapp(nuevo);
    onCambiar({ linkUrl: armarLinkWhatsApp(nuevo.numero, nuevo.mensaje) });
  };

  const elegirAccion = (nueva: AccionBanner) => {
    setAccion(nueva);
    onCambiar({
      linkUrl: nueva === 'whatsapp' ? armarLinkWhatsApp(whatsapp.numero, whatsapp.mensaje) : nueva === 'link' && accion === 'link' ? banner.linkUrl : '',
      pantalla: nueva === 'pantalla' ? banner.pantalla : '',
    });
  };

  const link = banner.linkUrl.trim();
  const linkNoLoAbreLaApp = accion === 'link' && link !== '' && !linkLoAbreLaApp(link);
  const whatsappInvalido = accion === 'whatsapp' && !esLinkWhatsApp(banner.linkUrl);
  const tieneAccion =
    (accion === 'link' && linkLoAbreLaApp(link)) || (accion === 'whatsapp' && !whatsappInvalido) || (accion === 'pantalla' && banner.pantalla !== '');

  return (
    <div className="campanias-seccion-columnas">
      <div className="campanias-seccion-campos">
        <label className="campanias-label">
          <span className="campanias-label-linea">
            Etiqueta <span className="campanias-ayuda">(opcional, ej. NOVEDAD)</span> <CampaniaContador valor={banner.etiqueta} maximo={LARGOS_BANNER.etiqueta} />
          </span>
          <input className="campanias-input" value={banner.etiqueta} disabled={deshabilitado} onChange={(e) => onCambiar({ etiqueta: e.target.value })} />
        </label>

        <label className="campanias-label">
          <span className="campanias-label-linea">
            Título <CampaniaContador valor={banner.titulo} maximo={LARGOS_BANNER.titulo} />
          </span>
          <input className="campanias-input" value={banner.titulo} disabled={deshabilitado} onChange={(e) => onCambiar({ titulo: e.target.value })} />
        </label>

        <label className="campanias-label">
          <span className="campanias-label-linea">
            Texto <span className="campanias-ayuda">(opcional, una línea corta)</span> <CampaniaContador valor={banner.texto} maximo={LARGOS_BANNER.texto} />
          </span>
          <input className="campanias-input" value={banner.texto} disabled={deshabilitado} onChange={(e) => onCambiar({ texto: e.target.value })} />
        </label>

        <div className="campanias-label">
          Al tocar el banner
          <div className="campanias-modo" role="group" aria-label="Qué hace al tocar el banner">
            {ACCIONES.map((opcion) => (
              <button
                type="button"
                key={opcion.valor}
                className={`campanias-modo-opcion ${accion === opcion.valor ? 'campanias-modo-opcion-activa' : ''}`}
                onClick={() => elegirAccion(opcion.valor)}
                aria-pressed={accion === opcion.valor}
                disabled={deshabilitado}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {accion === 'link' && (
          <label className="campanias-label">
            Link <span className="campanias-ayuda">(solo andessalud.com.ar o andessalud.ar)</span>
            <input
              className="campanias-input"
              type="url"
              placeholder="https://"
              value={banner.linkUrl}
              disabled={deshabilitado}
              onChange={(e) => onCambiar({ linkUrl: e.target.value })}
            />
          </label>
        )}
        {linkNoLoAbreLaApp && (
          <p className="campanias-aviso">
            El link tiene que empezar con https:// y ser de andessalud.com.ar o andessalud.ar. La app no abre otros sitios desde un banner.
          </p>
        )}

        {accion === 'whatsapp' && (
          <>
            <label className="campanias-label">
              Número de WhatsApp <span className="campanias-ayuda">(de Argentina, con 54 adelante y sin 0 ni 15: ej. 5492613300622)</span>
              <input
                className="campanias-input"
                inputMode="numeric"
                placeholder="5492613300622"
                value={whatsapp.numero}
                disabled={deshabilitado}
                onChange={(e) => cambiarWhatsapp('numero', e.target.value)}
              />
            </label>
            <label className="campanias-label">
              Mensaje inicial <span className="campanias-ayuda">(opcional)</span>
              <input
                className="campanias-input"
                maxLength={LARGO_MENSAJE_WHATSAPP}
                placeholder="Hola, quiero info de Andes Pet"
                value={whatsapp.mensaje}
                disabled={deshabilitado}
                onChange={(e) => cambiarWhatsapp('mensaje', e.target.value)}
              />
            </label>
            {whatsapp.numero.trim() !== '' && whatsappInvalido && (
              <p className="campanias-aviso">El número tiene que ser de Argentina: 54 + código de área + número, sin 0 ni 15.</p>
            )}
          </>
        )}

        {accion === 'pantalla' && (
          <div className="campanias-label">
            Pantalla de la app
            <SelectorPantalla valor={banner.pantalla} onCambiar={(pantalla) => onCambiar({ pantalla })} deshabilitado={deshabilitado} />
          </div>
        )}

        <label className="campanias-label">
          <span className="campanias-label-linea">
            Texto del botón <span className="campanias-ayuda">(opcional, ej. Entrá a Gestión)</span>{' '}
            <CampaniaContador valor={banner.textoBoton} maximo={LARGOS_BANNER.textoBoton} />
          </span>
          <input className="campanias-input" value={banner.textoBoton} disabled={deshabilitado} onChange={(e) => onCambiar({ textoBoton: e.target.value })} />
        </label>
        {banner.textoBoton.trim() !== '' && !tieneAccion && (
          <p className="campanias-aviso">El botón solo se muestra si al tocar el banner abre un link o una pantalla.</p>
        )}

        <div className="campanias-label">
          Diseño
          <div className="campanias-modo" role="group" aria-label="Diseño del banner">
            {PLANTILLAS.map((opcion) => (
              <button
                type="button"
                key={opcion.valor}
                className={`campanias-modo-opcion ${banner.plantilla === opcion.valor ? 'campanias-modo-opcion-activa' : ''}`}
                onClick={() => onCambiar({ plantilla: opcion.valor })}
                aria-pressed={banner.plantilla === opcion.valor}
                disabled={deshabilitado}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <label className="campanias-check">
          <input
            type="checkbox"
            checked={banner.mostrarCarita}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ mostrarCarita: e.target.checked })}
          />
          Mostrar la carita de Andes
        </label>

        <div className="campanias-fila">
          <label className="campanias-label">
            Se muestra desde <span className="campanias-ayuda">(opcional)</span>
            <input className="campanias-input" type="date" value={banner.vigenciaDesde} disabled={deshabilitado} onChange={(e) => onCambiar({ vigenciaDesde: e.target.value })} />
          </label>
          <label className="campanias-label">
            Hasta, inclusive <span className="campanias-ayuda">(opcional)</span>
            <input className="campanias-input" type="date" value={banner.vigenciaHasta} disabled={deshabilitado} onChange={(e) => onCambiar({ vigenciaHasta: e.target.value })} />
          </label>
        </div>
        <p className="campanias-ayuda">
          Le sale a los afiliados vigentes de la lista de la campaña, con la app 7.1.4 o más nueva. Se crea en la pestaña Banner cuando
          enviás a todos, y se pausa si cancelás la campaña. El banner de una campaña no lleva imagen.
        </p>
      </div>

      <div className="campanias-seccion-preview">
        <span className="campanias-sublabel">Vista previa en la app</span>
        <BannerPreview
          modo="claro"
          etiqueta={banner.etiqueta}
          titulo={banner.titulo}
          texto={banner.texto}
          imagenUrl={null}
          plantilla={banner.plantilla}
          textoBoton={banner.textoBoton}
          mostrarCarita={banner.mostrarCarita}
          conLink={tieneAccion}
        />
      </div>
    </div>
  );
};

export default CampaniaContenidoBanner;
