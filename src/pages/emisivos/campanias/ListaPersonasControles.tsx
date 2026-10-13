// ListaPersonasControles.tsx — el buscador con filtros y el paginado de las tablas de personas de una campaña
// (paso Destinatarios y Estadísticas). El estado vive en useListaPersonas.

import { FaSearch } from 'react-icons/fa';
import type { FiltroLista } from './campanias.api';
import { numero } from './campaniasOpciones';

interface BuscadorProps {
  valor: string;
  onCambiar: (valor: string) => void;
  filtros: { valor: FiltroLista; etiqueta: string }[];
  filtro: FiltroLista;
  onFiltro: (filtro: FiltroLista) => void;
}

export const BuscadorPersonas = ({ valor, onCambiar, filtros, filtro, onFiltro }: BuscadorProps) => (
  <div className="campanias-lista-filtros">
    <label className="campanias-lista-buscador">
      <FaSearch aria-hidden="true" />
      <input
        className="campanias-input"
        type="search"
        placeholder="Buscar por DNI, CUIL, mail o nombre"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        aria-label="Buscar en la lista"
      />
    </label>
    <div className="campanias-modo" role="group" aria-label="Filtrar la lista">
      {filtros.map((opcion) => (
        <button
          type="button"
          key={opcion.valor}
          className={`campanias-modo-opcion ${filtro === opcion.valor ? 'campanias-modo-opcion-activa' : ''}`}
          onClick={() => onFiltro(opcion.valor)}
          aria-pressed={filtro === opcion.valor}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  </div>
);

interface PaginadoProps {
  total: number;
  pagina: number;
  paginas: number;
  cargando: boolean;
  onPagina: (pagina: number) => void;
}

export const PaginadoPersonas = ({ total, pagina, paginas, cargando, onPagina }: PaginadoProps) => (
  <div className="campanias-lista-paginado">
    <span className="campanias-ayuda">
      {cargando ? 'Cargando...' : `${numero(total)} ${total === 1 ? 'persona' : 'personas'}${paginas > 1 ? ` · página ${pagina} de ${paginas}` : ''}`}
    </span>
    {paginas > 1 && (
      <div className="campanias-lista-paginas">
        <button
          type="button"
          className="campanias-btn campanias-btn-secundario campanias-btn-chico"
          onClick={() => onPagina(pagina - 1)}
          disabled={pagina <= 1 || cargando}
        >
          Anterior
        </button>
        <button
          type="button"
          className="campanias-btn campanias-btn-secundario campanias-btn-chico"
          onClick={() => onPagina(pagina + 1)}
          disabled={pagina >= paginas || cargando}
        >
          Siguiente
        </button>
      </div>
    )}
  </div>
);
