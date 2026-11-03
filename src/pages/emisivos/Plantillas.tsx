// Plantillas.tsx

import { useEffect, useState } from "react";
import { FaEye, FaTimes, FaFileAlt, FaPen } from "react-icons/fa";
import { PLANTILLAS_EJEMPLO, PlantillaEjemplo } from "./plantillasEjemplos";
import PlantillaTextosModal from "./PlantillaTextosModal";
import { IDS_EDITABLES, listarTextosPlantillas, previewTextosPlantilla, textosDeCampos } from "./plantillasTextos.api";
import type { PlantillaTextos } from "./plantillasTextos.api";
import './Plantillas.css';

const Plantillas = () => {
  const [seleccionada, setSeleccionada] = useState<PlantillaEjemplo | null>(null);
  const [textos, setTextos] = useState<PlantillaTextos[]>([]);
  const [editando, setEditando] = useState<PlantillaTextos | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarTextosPlantillas().then(setTextos).catch(() => {
      // Se vuelve a pedir al tocar "Ver plantilla" o "Editar textos", y ahí se muestra el error.
    });
  }, []);

  /** Siempre del servidor: otra persona pudo haberlos editado desde que se abrió la pantalla. */
  const obtenerTextos = async (id: number) => {
    const lista = await listarTextosPlantillas();
    setTextos(lista);
    const encontrada = lista.find((t) => t.id === id);
    if (!encontrada) throw new Error('El servidor no devolvió los textos de esta plantilla.');
    return encontrada;
  };

  // Traba todas las tarjetas mientras dura el pedido: así no se cruzan dos respuestas ni se abren dos ventanas.
  const conCarga = async (accion: () => Promise<void>) => {
    setCargando(true);
    setError('');
    try {
      await accion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const ver = (p: PlantillaEjemplo) => {
    if (!IDS_EDITABLES.includes(p.id)) {
      setSeleccionada(p);
      return;
    }
    // Las editables se dibujan en el servidor, con el texto vigente: la copia de plantillasEjemplos.ts quedó vieja.
    conCarga(async () => {
      const plantilla = await obtenerTextos(p.id);
      const { html } = await previewTextosPlantilla(p.id, textosDeCampos(plantilla.campos));
      setSeleccionada({ ...p, html });
    });
  };

  const editar = (id: number) => conCarga(async () => setEditando(await obtenerTextos(id)));

  const alCambiarTextos = (cambiada: PlantillaTextos) => {
    setTextos((lista) => lista.map((t) => (t.id === cambiada.id ? cambiada : t)));
    setEditando(cambiada);
  };

  return (
    <div className="plantillas-wrapper">
      <div className="plantillas-header">
        <h2 className="plantillas-header-title">Plantillas de Email</h2>
        <p className="plantillas-header-description">
          Previsualizá cómo le llega cada plantilla al afiliado, con datos de ejemplo ficticios.
        </p>
      </div>

      <div className="plantillas-container">
        {error && <p className="plantillas-textos-error" role="alert">{error}</p>}
        <div className="plantillas-grid">
          {PLANTILLAS_EJEMPLO.map((p) => {
            const editable = IDS_EDITABLES.includes(p.id);
            return (
              <div key={p.id} className="plantillas-card">
                <div className="plantillas-card-icon">
                  <FaFileAlt />
                </div>
                <div className="plantillas-card-body">
                  <span className="plantillas-card-id">ID {p.id}</span>
                  {textos.find((t) => t.id === p.id)?.modificada && (
                    <span className="plantillas-card-modificada">Texto modificado</span>
                  )}
                  <h3 className="plantillas-card-nombre">{p.nombre}</h3>
                  <p className="plantillas-card-desc">{p.descripcion}</p>
                </div>
                <button
                  className="plantillas-card-btn"
                  onClick={() => ver(p)}
                  disabled={cargando}
                >
                  <FaEye /> Ver plantilla
                </button>
                {editable && (
                  <button
                    className="plantillas-textos-btn-sec"
                    onClick={() => editar(p.id)}
                    disabled={cargando}
                  >
                    <FaPen /> Editar textos
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {seleccionada && (
        <div className="plantillas-modal-overlay" onClick={() => setSeleccionada(null)}>
          <div className="plantillas-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plantillas-preview-header">
              <div>
                <h3 className="plantillas-preview-title">{seleccionada.nombre}</h3>
                <p className="plantillas-preview-subtitle">{seleccionada.descripcion} · Vista previa con datos de ejemplo</p>
              </div>
              <button onClick={() => setSeleccionada(null)} className="plantillas-preview-close">
                <FaTimes />
              </button>
            </div>
            <div className="plantillas-preview-body">
              <iframe
                title={seleccionada.nombre}
                srcDoc={seleccionada.html}
                className="plantillas-preview-iframe"
                sandbox=""
              />
            </div>
          </div>
        </div>
      )}

      {editando && (
        <PlantillaTextosModal key={editando.id} plantilla={editando} onCambio={alCambiarTextos} onCerrar={() => setEditando(null)} />
      )}
    </div>
  );
};

export default Plantillas;
