// CampaniaPersonas.tsx — tabla de personas de solo lectura en Estadísticas (pedido de Nico 13/10): quién rebotó, abrió,
// tocó el botón, leyó la push o no tiene la app, sin tener que bajar el Excel. Mismos datos que el Excel, de a 50.

import type { Campania, DestinatarioFila } from './campanias.api';
import { FILTROS_PERSONAS, cruzaConPadron, fechaHora } from './campaniasOpciones';
import { useListaPersonas } from './useListaPersonas';
import { BuscadorPersonas, PaginadoPersonas } from './ListaPersonasControles';

interface PersonasProps {
  campania: Campania;
  /** Cambia cada vez que se actualizan las estadísticas: la tabla se vuelve a pedir con los datos nuevos. */
  actualizadoAt: string | null;
}

const PUSH: Record<string, string> = {
  ENCOLADO: 'Le llegó al celu',
  SIN_TOKEN: 'En el buzón de la app',
  PUSH_APAGADO: 'Tiene la push apagada',
  SIN_CUENTA: 'Sin cuenta en la app',
  SIN_CUIL: 'Sin CUIL',
  ERROR: 'Error',
  INCIERTO: 'No se sabe si salió',
  ENVIANDO: 'Enviando',
};

const MAIL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ENVIANDO: 'Enviando',
  ENVIADO: 'Enviado',
  ERROR: 'Rebotó',
  OMITIDO: 'No se mandó',
};

/** "Abrió 13/10/2026 10:51" etc.: solo lo que pasó, una cosa por línea. */
const eventos = (pares: [string, string | null][]): string[] => pares.filter(([, fecha]) => fecha).map(([texto, fecha]) => `${texto} ${fechaHora(fecha)}`);

const celdaPush = (fila: DestinatarioFila) => {
  if (!fila.pushEstado) return '—';
  return [PUSH[fila.pushEstado] ?? fila.pushEstado, ...eventos([['Leída', fila.pushLeidaAt]])].join('\n');
};

const celdaMail = (fila: DestinatarioFila) => {
  if (!fila.mailEstado) return '—';
  return [
    MAIL[fila.mailEstado] ?? fila.mailEstado,
    ...eventos([['Abrió', fila.mailAbiertoAt], ['Tocó el botón', fila.mailClickAt], ['Se dio de baja', fila.mailBajaAt]]),
  ].join('\n');
};

const celdaBanner = (fila: DestinatarioFila) => eventos([['Lo vio', fila.bannerVistoAt], ['Lo tocó', fila.bannerTocadoAt]]).join('\n') || '—';

const CampaniaPersonas = ({ campania, actualizadoAt }: PersonasProps) => {
  const lista = useListaPersonas(campania.id, actualizadoAt);
  const { filas, buscar, filtro, cargando, error } = lista;
  const { canales } = campania;
  const esAfiliados = campania.tipoDestinatario === 'afiliados';
  const conPadron = cruzaConPadron(campania.tipoDestinatario);
  const filtros = FILTROS_PERSONAS.filter(
    (f) => (!f.canal || canales[f.canal]) && (!f.soloAfiliados || esAfiliados) && (!f.conPadron || conPadron),
  );
  const columnas = 4 + (esAfiliados ? 1 : 0) + (canales.push ? 1 : 0) + (canales.mail ? 1 : 0) + (canales.banner ? 1 : 0);

  return (
    <div className="campanias-lista-editable">
      <strong className="campanias-tabla-titulo">Persona por persona</strong>
      <p className="campanias-ayuda">Lo mismo que el Excel, para buscar a alguien o ver un grupo sin descargarlo.</p>

      <BuscadorPersonas valor={lista.buscarEscrito} onCambiar={lista.setBuscarEscrito} filtros={filtros} filtro={filtro} onFiltro={lista.setFiltro} />

      {error && <p className="campanias-error">{error}</p>}

      <div className="campanias-tabla-marco">
        <table className="campanias-tabla">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Mail</th>
              {esAfiliados && <th>App</th>}
              {canales.push && <th>Push</th>}
              {canales.mail && <th>Mail enviado</th>}
              {canales.banner && <th>Banner</th>}
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id} className={fila.estadoLista === 'OK' ? '' : 'campanias-fila-apagada'}>
                <td>{fila.dni ?? fila.cuil ?? '—'}</td>
                <td>{fila.nombre ?? '—'}</td>
                <td>{fila.email ?? '—'}</td>
                {esAfiliados && <td>{fila.tieneApp ? 'Sí' : 'No'}</td>}
                {canales.push && <td className="campanias-celda-lineas">{celdaPush(fila)}</td>}
                {canales.mail && <td className="campanias-celda-lineas">{celdaMail(fila)}</td>}
                {canales.banner && <td className="campanias-celda-lineas">{celdaBanner(fila)}</td>}
                <td className="campanias-celda-estado">{fila.motivo ?? ''}</td>
              </tr>
            ))}
            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan={columnas}>{buscar || filtro !== 'todos' ? 'Nadie coincide con la búsqueda.' : 'La lista está vacía.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginadoPersonas total={lista.total} pagina={lista.pagina} paginas={lista.paginas} cargando={cargando} onPagina={lista.setPagina} />
    </div>
  );
};

export default CampaniaPersonas;
