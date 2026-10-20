//EmisivosMain.tsx

import Plantillas from "./Plantillas";
import Banner from "./Banner";
import Encuestas from "./encuestas/Encuestas";
import Campanias from "./campanias/Campanias";
import Beneficios from "./beneficios/Beneficios";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import CrearNotificaciones from "./CrearNotificaciones";
import VerNotificaciones from "./VerNotificaciones";
import VerMensajes from "./VerMensajes";
import VerNotificacionesMasivas from "./VerNotificacionesMasivas";
import './EmisivosMain.css';

/**
 * Pestañas de Emisivos, en el orden en que se ven. Para sumar una pestaña nueva alcanza con UNA línea acá
 * (por ejemplo { id: 'encuestas', titulo: 'Encuestas', contenido: <Encuestas /> }): el indicador animado calcula
 * el ancho y el desplazamiento con la cantidad de pestañas.
 */
const PESTANAS: { id: string; titulo: string; contenido: ReactNode }[] = [
  { id: 'crear', titulo: 'Crear Notificaciones', contenido: <CrearNotificaciones /> },
  { id: 'verNotificacionesMasivas', titulo: 'Notificaciones Masivas', contenido: <VerNotificacionesMasivas /> },
  { id: 'verNotificaciones', titulo: 'Ver Notificaciones', contenido: <VerNotificaciones /> },
  { id: 'verMensajes', titulo: 'Ver Mensajes', contenido: <VerMensajes /> },
  { id: 'plantillas', titulo: 'Plantillas', contenido: <Plantillas /> },
  { id: 'banner', titulo: 'Banner', contenido: <Banner /> },
  { id: 'campanias', titulo: 'Campañas', contenido: <Campanias /> },
  { id: 'encuestas', titulo: 'Encuestas', contenido: <Encuestas /> },
  { id: 'beneficios', titulo: 'Beneficios', contenido: <Beneficios /> },
];

/** Ancho mínimo de cada pestaña (rem): si la barra no entra en la pantalla, se desplaza en horizontal. */
const ANCHO_MINIMO_PESTANA_REM = 8;

const EmisivosMain = () => {
  // Arranca en "Crear Notificaciones" (la de siempre); las pestañas nuevas van al final.
  const [activeTab, setActiveTab] = useState<string>('crear');
  const botonesPestana = useRef<Record<string, HTMLButtonElement | null>>({});

  // Con scroll horizontal en la barra, la pestaña activa se trae a la vista (el scroll del contenedor, no el de la página).
  useEffect(() => {
    botonesPestana.current[activeTab]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const cantidad = PESTANAS.length;
  const indiceActivo = Math.max(0, PESTANAS.findIndex((pestana) => pestana.id === activeTab));
  const pestanaActiva = PESTANAS[indiceActivo];

  return (
    <div className="emisivos-main-wrapper">
      <div className="emisivos-tabs-container">
        <div className="emisivos-tabs-scroll" style={{ minWidth: `${cantidad * ANCHO_MINIMO_PESTANA_REM}rem` }}>
          <div className="emisivos-tabs">
            {PESTANAS.map((pestana) => (
              <button
                key={pestana.id}
                ref={(boton) => {
                  botonesPestana.current[pestana.id] = boton;
                }}
                className={`emisivos-tab ${activeTab === pestana.id ? 'emisivos-tab-active' : ''}`}
                onClick={() => setActiveTab(pestana.id)}
              >
                {pestana.titulo}
              </button>
            ))}
          </div>
          <div
            className="emisivos-tab-indicator"
            style={{
              transform: `translateX(${indiceActivo * 100}%)`,
              width: `${100 / cantidad}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="emisivos-tab-content">{pestanaActiva.contenido}</div>
    </div>
  );
};

export default EmisivosMain;
