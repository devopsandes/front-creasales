// PlantillaTextosModal.tsx — editor de los textos de una plantilla de Bienvenida o Pre-Alta.
// Diseño, logo, datos del afiliado y links quedan fijos en el servidor: acá solo se editan los textos.

import { useState } from 'react';
import { FaEye, FaTimes } from 'react-icons/fa';
import { useConfirmacion } from './useConfirmacion';
import {
  guardarTextosPlantilla,
  previewTextosPlantilla,
  restaurarTextosPlantilla,
  textosDeCampos,
} from './plantillasTextos.api';
import type { PlantillaTextos, Textos } from './plantillasTextos.api';

type Props = {
  plantilla: PlantillaTextos;
  onCambio: (plantilla: PlantillaTextos) => void;
  onCerrar: () => void;
};

const mensajeDe = (err: unknown) => (err instanceof Error ? err.message : 'Error de conexión');

const PlantillaTextosModal = ({ plantilla, onCambio, onCerrar }: Props) => {
  const [valores, setValores] = useState<Textos>(() => textosDeCampos(plantilla.campos));
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [vista, setVista] = useState<{ html: string; asunto: string } | null>(null);
  const { confirmar, ventanaConfirmacion } = useConfirmacion();

  const hayCambios = plantilla.campos.some((campo) => valores[campo.clave] !== campo.valor);

  const ejecutar = async (accion: () => Promise<void>) => {
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      await accion();
    } catch (err) {
      setError(mensajeDe(err));
    } finally {
      setOcupado(false);
    }
  };

  const verComoQueda = () => ejecutar(async () => {
    setVista(await previewTextosPlantilla(plantilla.id, valores));
  });

  const guardar = () => ejecutar(async () => {
    const guardada = await guardarTextosPlantilla(plantilla.id, valores);
    onCambio(guardada);
    setValores(textosDeCampos(guardada.campos));
    setAviso('Textos guardados. Se usan desde el próximo envío.');
  });

  const volverAlOriginal = async () => {
    const seguro = await confirmar({
      titulo: 'Volver al texto original',
      mensaje: `${plantilla.nombre} vuelve al texto original y se pierde lo que se haya cambiado. Se aplica desde el próximo envío.`,
      textoConfirmar: 'Volver al original',
    });
    if (!seguro) return;
    await ejecutar(async () => {
      const restaurada = await restaurarTextosPlantilla(plantilla.id);
      onCambio(restaurada);
      setValores(textosDeCampos(restaurada.campos));
      setAviso('La plantilla volvió al texto original.');
    });
  };

  const intentarCerrar = async () => {
    if (ocupado) return; // Con un guardado en curso, cerrar no lo frena: el texto quedaría guardado igual.
    if (hayCambios) {
      const seguro = await confirmar({
        titulo: 'Cambios sin guardar',
        mensaje: 'Si cerrás ahora, se pierde lo que escribiste.',
        textoConfirmar: 'Cerrar sin guardar',
        textoCancelar: 'Seguir editando',
      });
      if (!seguro) return;
    }
    onCerrar();
  };

  return (
    <>
    <div className="plantillas-modal-overlay" onClick={intentarCerrar}>
      <div className="plantillas-preview-modal plantillas-textos-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plantillas-preview-header">
          <div>
            <h3 className="plantillas-preview-title">Editar textos · {plantilla.nombre}</h3>
            <p className="plantillas-preview-subtitle">{plantilla.descripcion}</p>
          </div>
          <button type="button" onClick={intentarCerrar} className="plantillas-preview-close" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        {vista ? (
          <div className="plantillas-preview-body">
            <p className="plantillas-textos-asunto"><strong>Asunto:</strong> {vista.asunto}</p>
            <iframe title={`Vista previa de ${plantilla.nombre}`} srcDoc={vista.html} className="plantillas-preview-iframe" sandbox="" />
          </div>
        ) : (
          <div className="plantillas-textos-form">
            <p className="plantillas-textos-aviso">
              Los cambios se aplican a los próximos envíos. Lo ya enviado no cambia.
            </p>
            <p className="plantillas-textos-ayuda">
              Formato: <code>**negrita**</code>, una línea en blanco para un párrafo nuevo, emojis y <code>{'{{NOMBRE}}'}</code> para
              el nombre del afiliado (en el asunto no). Un link escrito acá sale como texto: los botones y links del mail no se editan.
            </p>
            {plantilla.campos.map((campo) => {
              const valor = valores[campo.clave] ?? '';
              return (
                <div key={campo.clave} className="plantillas-textos-campo">
                  <label htmlFor={`texto-${campo.clave}`}>
                    {campo.etiqueta}{campo.obligatorio ? ' *' : ''}
                  </label>
                  {campo.unaLinea ? (
                    <input
                      id={`texto-${campo.clave}`}
                      type="text"
                      value={valor}
                      disabled={ocupado}
                      maxLength={campo.largoMaximo}
                      onChange={(e) => setValores({ ...valores, [campo.clave]: e.target.value })}
                    />
                  ) : (
                    <textarea
                      id={`texto-${campo.clave}`}
                      rows={4}
                      value={valor}
                      disabled={ocupado}
                      maxLength={campo.largoMaximo}
                      onChange={(e) => setValores({ ...valores, [campo.clave]: e.target.value })}
                    />
                  )}
                  <span className="plantillas-textos-contador">{valor.length} / {campo.largoMaximo}</span>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="plantillas-textos-error" role="alert">{error}</p>}
        {aviso && <p className="plantillas-textos-ok" role="status">{aviso}</p>}

        <div className="plantillas-textos-acciones">
          {vista ? (
            <button type="button" className="plantillas-textos-btn-sec" onClick={() => setVista(null)}>
              Volver a editar
            </button>
          ) : (
            <>
              <button type="button" className="plantillas-textos-btn-sec" onClick={volverAlOriginal} disabled={ocupado || !plantilla.modificada}>
                Volver al texto original
              </button>
              <button type="button" className="plantillas-textos-btn-sec" onClick={verComoQueda} disabled={ocupado}>
                <FaEye /> Ver cómo queda
              </button>
              <button type="button" className="plantillas-card-btn" onClick={guardar} disabled={ocupado || !hayCambios}>
                Guardar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    {ventanaConfirmacion}
    </>
  );
};

export default PlantillaTextosModal;
