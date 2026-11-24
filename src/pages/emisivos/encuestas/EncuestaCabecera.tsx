// EncuestaCabecera.tsx — "Imagen o video de cabecera" de una encuesta pública (24/11/2026, sorteo del reloj): lo que va
// arriba del título en la web (andessalud.com.ar/encuesta/). Se elige acá y se sube al guardar la encuesta, como la imagen
// del mail (EncuestaMailEditor). Topes y tipos: encuestasOpciones.ts (los mismos que valida emisivos).

import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { urlCabecera } from './encuestas.api';
import { ACCEPT_CABECERA, errorDeCabecera, tipoDeArchivoCabecera } from './encuestasOpciones';

/** La cabecera que se va a subir al guardar: un archivo recién elegido, o quitar la que ya tenía. */
export interface CambioCabecera {
  archivo: File | null;
  quitar: boolean;
}

interface EncuestaCabeceraProps {
  /** Id de la encuesta ya guardada (para ver la cabecera que tiene); null si es nueva. */
  idGuardada: number | null;
  /** Lo que dice emisivos de la cabecera guardada. */
  tieneGuardada: boolean;
  tipoGuardada: 'imagen' | 'video' | null;
  /** Cambia la URL de la guardada para no ver una vieja del caché del navegador. */
  version: number;
  cambio: CambioCabecera;
  onCambio: (cambio: CambioCabecera) => void;
  onError: (mensaje: string) => void;
}

const EncuestaCabecera = ({ idGuardada, tieneGuardada, tipoGuardada, version, cambio, onCambio, onError }: EncuestaCabeceraProps) => {
  // Vista previa del archivo elegido: se libera al cambiarlo o al cerrar el formulario.
  const [urlNueva, setUrlNueva] = useState<string | null>(null);
  useEffect(() => {
    if (!cambio.archivo) {
      setUrlNueva(null);
      return;
    }
    const url = URL.createObjectURL(cambio.archivo);
    setUrlNueva(url);
    return () => URL.revokeObjectURL(url);
  }, [cambio.archivo]);

  const elegir = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    const problema = errorDeCabecera(archivo);
    if (problema) {
      onError(problema);
      return;
    }
    onCambio({ archivo, quitar: false });
  };

  const guardadaVisible = idGuardada !== null && tieneGuardada && !cambio.quitar;
  const vista = urlNueva ?? (guardadaVisible ? urlCabecera(idGuardada, version) : null);
  const tipo = cambio.archivo ? tipoDeArchivoCabecera(cambio.archivo.type) : guardadaVisible ? tipoGuardada : null;

  return (
    <div>
      <label className="encuestas-label">
        Imagen o video de cabecera{' '}
        <span className="encuestas-ayuda">
          (opcional, va arriba del título en el formulario. Imagen JPG, PNG o WebP hasta 1 MB, o video MP4 hasta 3 MB: 5 a 10
          segundos en 720p, sin sonido. Se sube al guardar la encuesta)
        </span>
        <input className="encuestas-input" type="file" accept={ACCEPT_CABECERA} onChange={elegir} />
      </label>
      {vista && tipo ? (
        <>
          {tipo === 'video' ? (
            <video className="encuestas-imagen-mail" src={vista} muted loop autoPlay playsInline aria-label="Video de cabecera" />
          ) : (
            <img className="encuestas-imagen-mail" src={vista} alt="Imagen de cabecera" />
          )}
          <button
            type="button"
            className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico encuestas-btn-agregar"
            onClick={() => onCambio({ archivo: null, quitar: tieneGuardada })}
          >
            Quitar cabecera
          </button>
        </>
      ) : (
        <p className="encuestas-ayuda">Sin cabecera, el formulario arranca directo con el título.</p>
      )}
    </div>
  );
};

export default EncuestaCabecera;
