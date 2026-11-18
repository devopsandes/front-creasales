// CampaniaPasoPlaca.tsx — paso 1 de la "Campaña con placa propia" (Ruy, 16/11/2026): nombre, asunto, la placa (HTML pegado
// o imagen subida), el botón opcional debajo, el link y el texto alternativo. La imagen la arma placaImagen.ts en el
// navegador; se sube al guardar.

import type { ChangeEvent } from 'react';
import { FaEye, FaMagic } from 'react-icons/fa';
import CampaniaContador from './CampaniaContador';
import type { DatosPlaca } from './campanias.api';
import { LARGOS, errorDeImagenMail } from './campaniasOpciones';
import { MAX_TEXTO_ALTERNATIVO } from './campaniaPlaca';
import { LINK_BOT_COMERCIAL } from './placaImagen';
import type { OrigenPlaca } from './placaImagen';

export type ModoPlaca = 'html' | 'imagen';

export interface EntradaPlaca {
  modo: ModoPlaca;
  html: string;
  archivo: File | null;
}

interface PasoPlacaProps {
  datos: DatosPlaca;
  onCambiar: (cambio: Partial<DatosPlaca>) => void;
  remitentes: string[];
  entrada: EntradaPlaca;
  onEntrada: (cambio: Partial<EntradaPlaca>) => void;
  /** La casilla "Agregar botón debajo" (estado aparte del texto: borrarlo para escribir otro no la destilda). */
  conBoton: boolean;
  onConBoton: (activo: boolean) => void;
  /** La placa armada (o la ya guardada) para mostrar; null si todavía no hay. */
  vistaPrevia: string | null;
  origen: OrigenPlaca | null;
  /** Hay cambios en el HTML, la imagen o el botón que todavía no se pasaron a la placa. */
  placaDesactualizada: boolean;
  armando: boolean;
  onArmar: () => void;
  onError: (mensaje: string | null) => void;
  onVerPreview: () => void;
  verificando: boolean;
  deshabilitado: boolean;
  /** Ya hay lista cargada: la casilla de sacar afiliados queda fija (cambiarla pide recargar la lista). */
  listaCargada: boolean;
}

const AVISO_ORIGEN: Record<OrigenPlaca, string> = {
  foto: 'Se armó con una foto del HTML.',
  incrustada:
    'No se pudo sacar la foto del HTML: se usó la imagen que traía adentro. Fijate que esté todo (si el HTML tenía un botón aparte, marcá "Agregar botón debajo").',
  subida: 'Se armó con la imagen que subiste.',
};

const CampaniaPasoPlaca = ({
  datos,
  onCambiar,
  remitentes,
  entrada,
  onEntrada,
  conBoton,
  onConBoton,
  vistaPrevia,
  origen,
  placaDesactualizada,
  armando,
  onArmar,
  onError,
  onVerPreview,
  verificando,
  deshabilitado,
  listaCargada,
}: PasoPlacaProps) => {
  const elegirImagen = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!archivo) return;
    // La imagen subida se recomprime a JPEG de hasta 1 MB al armar la placa: acá solo se mira que sea una imagen.
    const problema = errorDeImagenMail(new File([], archivo.name, { type: archivo.type }));
    if (problema) {
      onError(problema);
      return;
    }
    onError(null);
    onEntrada({ archivo });
  };

  const hayEntrada = entrada.modo === 'html' ? entrada.html.trim() !== '' : Boolean(entrada.archivo);

  return (
    <div className="campanias-seccion">
      <p className="campanias-ayuda">
        Pegá el HTML de la placa (el que te armó Claude) o subí la imagen. El mail sale con un saludo ("Hola, Juan.") y la placa
        entera como botón: al tocarla, abre el link de abajo. Sale desde notificaciones@andessalud.ar.
      </p>

      <label className="campanias-label">
        <span className="campanias-label-linea">
          Nombre de la campaña <span className="campanias-ayuda">(solo lo ves vos)</span> <CampaniaContador valor={datos.nombre} maximo={LARGOS.nombre} />
        </span>
        <input className="campanias-input" value={datos.nombre} disabled={deshabilitado} onChange={(e) => onCambiar({ nombre: e.target.value })} />
      </label>

      <label className="campanias-label">
        <span className="campanias-label-linea">
          Asunto <CampaniaContador valor={datos.asunto} maximo={LARGOS.asunto} />
        </span>
        <input className="campanias-input" value={datos.asunto} disabled={deshabilitado} onChange={(e) => onCambiar({ asunto: e.target.value })} />
        <span className="campanias-ayuda">Puede llevar {'{{NOMBRE}}'}: se reemplaza por el primer nombre de cada persona.</span>
      </label>

      <div className="campanias-fila">
        <label className="campanias-label">
          Remitente
          <select className="campanias-input" value={datos.remitente} disabled={deshabilitado} onChange={(e) => onCambiar({ remitente: e.target.value })}>
            {remitentes.map((remitente) => (
              <option key={remitente} value={remitente}>
                {remitente}
              </option>
            ))}
          </select>
        </label>
        <label className="campanias-label">
          Responder a <span className="campanias-ayuda">(opcional)</span>
          <input
            className="campanias-input"
            type="email"
            placeholder="Vacío = responden a notificaciones@andessalud.ar"
            value={datos.replyTo}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ replyTo: e.target.value })}
          />
        </label>
      </div>

      <label className="campanias-check">
        <input
          type="checkbox"
          checked={datos.sacarAfiliados}
          disabled={deshabilitado || listaCargada}
          onChange={(e) => onCambiar({ sacarAfiliados: e.target.checked })}
        />
        Sacar de la lista a los que ya son afiliados de Andes{' '}
        <span className="campanias-ayuda">
          {listaCargada
            ? '(para cambiarlo, volvé a cargar la lista después de guardar)'
            : '(sin tildar, le llega a toda la lista: afiliados y no afiliados)'}
        </span>
      </label>

      <fieldset className="campanias-fieldset" disabled={deshabilitado || armando}>
        <legend>La placa</legend>
        <div className="campanias-modo" role="group" aria-label="Cómo cargar la placa">
          {(
            [
              { valor: 'html', etiqueta: 'Pegar el HTML' },
              { valor: 'imagen', etiqueta: 'Subir una imagen' },
            ] as const
          ).map((opcion) => (
            <button
              type="button"
              key={opcion.valor}
              className={`campanias-modo-opcion ${entrada.modo === opcion.valor ? 'campanias-modo-opcion-activa' : ''}`}
              onClick={() => onEntrada({ modo: opcion.valor })}
              aria-pressed={entrada.modo === opcion.valor}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        {entrada.modo === 'html' ? (
          <label className="campanias-label">
            HTML de la placa
            <textarea
              className="campanias-input campanias-textarea campanias-textarea-codigo"
              rows={6}
              placeholder="Pegá acá todo el HTML que te dio Claude"
              value={entrada.html}
              onChange={(e) => onEntrada({ html: e.target.value })}
            />
            <span className="campanias-ayuda">
              Pedile a Claude que la arme de 600 px de ancho (la medida de los mails). No se ejecuta nada del HTML: solo se usa para sacarle una
              foto.
            </span>
          </label>
        ) : (
          <label className="campanias-label">
            Imagen <span className="campanias-ayuda">(JPG, PNG o WEBP)</span>
            <input className="campanias-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirImagen} />
            {entrada.archivo && <span className="campanias-ayuda">Elegida: {entrada.archivo.name}</span>}
          </label>
        )}

        <label className="campanias-check">
          <input
            type="checkbox"
            checked={conBoton}
            onChange={(e) => onConBoton(e.target.checked)}
          />
          Agregar botón debajo de la placa <span className="campanias-ayuda">(si la placa no trae el botón dibujado)</span>
        </label>
        {conBoton && (
          <label className="campanias-label">
            <span className="campanias-label-linea">
              Texto del botón <CampaniaContador valor={datos.textoBoton} maximo={LARGOS.botonTexto} />
            </span>
            <input className="campanias-input" value={datos.textoBoton} onChange={(e) => onCambiar({ textoBoton: e.target.value })} />
          </label>
        )}

        <div className="campanias-preview-mail-accion">
          <button type="button" className="campanias-btn campanias-btn-primario" onClick={onArmar} disabled={!hayEntrada || armando}>
            <FaMagic /> {armando ? 'Armando...' : 'Armar la placa'}
          </button>
          {placaDesactualizada && vistaPrevia && <span className="campanias-ayuda">Cambiaste algo: volvé a tocar "Armar la placa".</span>}
        </div>

        {vistaPrevia ? (
          <>
            <img className="campanias-imagen-mail" src={vistaPrevia} alt="Cómo queda la placa" />
            {origen && <p className="campanias-ayuda">{AVISO_ORIGEN[origen]}</p>}
          </>
        ) : (
          <p className="campanias-ayuda">Todavía no hay placa.</p>
        )}
      </fieldset>

      <label className="campanias-label">
        Link de la placa
        <input className="campanias-input" value={datos.botonLink} disabled={deshabilitado} onChange={(e) => onCambiar({ botonLink: e.target.value })} />
        <span className="campanias-ayuda">
          Por defecto, el WhatsApp del bot comercial con "Hola, vi el mail de Andes Salud y quiero cotizar".{' '}
          {datos.botonLink !== LINK_BOT_COMERCIAL && !deshabilitado && (
            <button type="button" className="campanias-link-boton" onClick={() => onCambiar({ botonLink: LINK_BOT_COMERCIAL })}>
              Volver al bot comercial
            </button>
          )}
        </span>
      </label>

      <label className="campanias-label">
        <span className="campanias-label-linea">
          Texto debajo de la placa <span className="campanias-ayuda">(opcional)</span>{' '}
          <CampaniaContador valor={datos.textoAlternativo} maximo={MAX_TEXTO_ALTERNATIVO} />
        </span>
        <textarea
          className="campanias-input campanias-textarea"
          rows={4}
          value={datos.textoAlternativo}
          disabled={deshabilitado}
          onChange={(e) => onCambiar({ textoAlternativo: e.target.value })}
        />
        <span className="campanias-ayuda">
          Se ve en el mail debajo de la placa (por ejemplo, la explicación de la promo). Acepta {'{{NOMBRE}}'}, **negrita** y una línea en blanco
          para empezar otro párrafo. También lo leen los que tienen las imágenes bloqueadas (Outlook).
        </span>
      </label>

      <div className="campanias-preview-mail-accion">
        <button type="button" className="campanias-btn campanias-btn-secundario" onClick={onVerPreview} disabled={verificando || deshabilitado}>
          <FaEye /> {verificando ? 'Preparando...' : 'Ver cómo queda el mail'}
        </button>
        <span className="campanias-ayuda">Guarda la campaña y muestra el mail como le llega a la gente.</span>
      </div>
    </div>
  );
};

export default CampaniaPasoPlaca;
