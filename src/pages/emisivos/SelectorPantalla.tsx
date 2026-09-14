// SelectorPantalla.tsx — lista de pantallas de la app para "Al tocar el banner". Se abre SIEMPRE hacia abajo:
// el <select> nativo de Chrome se abría para arriba cuando no le alcanzaba el lugar (Nico 14/09).

import { useEffect, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { PANTALLAS_APP, nombrePantalla } from './bannerOpciones';

interface SelectorPantallaProps {
  /** '' = ninguna elegida */
  valor: string;
  onCambiar: (valor: string) => void;
}

const SelectorPantalla = ({ valor, onCambiar }: SelectorPantallaProps) => {
  const [abierta, setAbierta] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  // Se cierra al hacer clic afuera o con Escape; al abrir, el modal scrollea para que se vea la lista entera.
  useEffect(() => {
    if (!abierta) return;
    lista.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const alHacerClic = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierta(false);
    };
    const alApretarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierta(false);
    };
    document.addEventListener('mousedown', alHacerClic);
    document.addEventListener('keydown', alApretarTecla);
    return () => {
      document.removeEventListener('mousedown', alHacerClic);
      document.removeEventListener('keydown', alApretarTecla);
    };
  }, [abierta]);

  const elegir = (nuevo: string) => {
    onCambiar(nuevo);
    setAbierta(false);
  };

  return (
    <div className="banner-selector" ref={contenedor}>
      <button
        type="button"
        className="banner-input banner-selector-boton"
        aria-haspopup="listbox"
        aria-expanded={abierta}
        onClick={() => setAbierta((actual) => !actual)}
      >
        <span className={valor ? '' : 'banner-selector-vacio'}>{valor ? nombrePantalla(valor) : 'Elegí una pantalla...'}</span>
        <FaChevronDown aria-hidden="true" />
      </button>
      {abierta && (
        <ul className="banner-selector-lista" role="listbox" ref={lista}>
          {PANTALLAS_APP.map((opcion) => (
            <li key={opcion.valor} role="option" aria-selected={valor === opcion.valor}>
              <button
                type="button"
                className={`banner-selector-opcion ${valor === opcion.valor ? 'banner-selector-opcion-activa' : ''}`}
                onClick={() => elegir(opcion.valor)}
              >
                {opcion.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectorPantalla;
