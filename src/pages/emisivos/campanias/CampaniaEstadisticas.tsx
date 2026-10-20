// CampaniaEstadisticas.tsx — modal con el estado de una campaña y sus números por canal: lista, app, parentesco, push, mail,
// banner y los cruces que pidió Gino (09/10/2026). Mientras se envía, se actualiza solo cada 10 segundos.
// Pausar, reanudar y cancelar se hacen desde acá también. El Excel trae una fila por persona con todas las fechas; el informe
// PDF es el resumen para mostrar (cifras, quién abrió, quién pidió la baja) y se arma en el navegador (informeCampania.ts).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FaBan, FaDownload, FaFilePdf, FaPause, FaPlay, FaSync, FaTimes } from 'react-icons/fa';
import {
  cancelarCampania,
  obtenerCampania,
  obtenerEstadisticas,
  pausarCampania,
  reanudarCampania,
  traerTodasLasPersonas,
  urlExportarCampania,
} from './campanias.api';
import type { Campania, EstadisticasCampania } from './campanias.api';
import { anchoBarra, canalesActivos, claseEstado, etiquetaEstado, fechaHora, numero, textoPorcentaje } from './campaniasOpciones';
import { useConfirmacion } from '../useConfirmacion';
import CampaniaPersonas from './CampaniaPersonas';
import { armarInforme, listasNecesarias, topeParaFiltro } from './informeCampania';
import type { ListasInforme } from './informeCampania';

interface EstadisticasProps {
  campania: Campania;
  onCerrar: () => void;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
}

const REFRESCO_MS = 10000;

/** Una fila con barra hecha con CSS: etiqueta, relleno proporcional y "cantidad (porcentaje%)". */
const Fila = ({ etiqueta, cantidad, base, ayuda }: { etiqueta: string; cantidad: number; base: number; ayuda?: string }) => (
  <div className="campanias-dato-fila" title={ayuda}>
    <span className="campanias-dato-etiqueta">{etiqueta}</span>
    <div
      className="campanias-barra"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={anchoBarra(cantidad, base)}
      aria-label={etiqueta}
    >
      <div className="campanias-barra-relleno" style={{ width: `${anchoBarra(cantidad, base)}%` }} />
    </div>
    <span className="campanias-dato-valor">
      {numero(cantidad)} ({textoPorcentaje(cantidad, base)})
    </span>
  </div>
);

const Tarjeta = ({ titulo, subtitulo, children, ancha = false }: { titulo: string; subtitulo?: string; children: ReactNode; ancha?: boolean }) => (
  <section className={`campanias-tarjeta-dato ${ancha ? 'campanias-tarjeta-dato-ancha' : ''}`}>
    <h3 className="campanias-tarjeta-dato-titulo">{titulo}</h3>
    {subtitulo && <p className="campanias-ayuda">{subtitulo}</p>}
    {children}
  </section>
);

/** Número grande con su explicación (para los totales que van arriba de cada tarjeta). */
const Destacado = ({ valor, texto }: { valor: string; texto: string }) => (
  <div className="campanias-destacado">
    <span className="campanias-destacado-numero">{valor}</span>
    <span className="campanias-ayuda">{texto}</span>
  </div>
);

const CampaniaEstadisticas = ({ campania: inicial, onCerrar, onAviso }: EstadisticasProps) => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [campania, setCampania] = useState<Campania>(inicial);
  const [stats, setStats] = useState<EstadisticasCampania | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [actualizadoAt, setActualizadoAt] = useState<string | null>(null);
  /** Mientras se arma el informe PDF: cuántos pasos van (estadísticas y una lista por vez). null si no se está armando. */
  const [armandoInforme, setArmandoInforme] = useState<{ hechos: number; total: number | null } | null>(null);

  const id = inicial.id;

  // ¿Sigue abierta la pantalla? Si se cierra mientras se arma el informe, se corta el armado y no se baja nada ni se avisa.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const refrescar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      try {
        const [actual, estadisticas] = await Promise.all([obtenerCampania(id), obtenerEstadisticas(id)]);
        setCampania(actual);
        setStats(estadisticas);
        setActualizadoAt(new Date().toISOString());
        setError(null);
      } catch (err) {
        // En un refresco automático no se pisan los números que ya se ven por un corte puntual.
        if (!silencioso) setError(err instanceof Error ? err.message : 'Error de conexión');
      } finally {
        if (!silencioso) setCargando(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const enviando = campania.estado === 'ENVIANDO';
  useEffect(() => {
    if (!enviando) return;
    const temporizador = setInterval(() => void refrescar(true), REFRESCO_MS);
    return () => clearInterval(temporizador);
  }, [enviando, refrescar]);

  const ejecutar = async (accion: () => Promise<{ meta?: { message?: string } }>, mensajeOk: string) => {
    setOcupado(true);
    try {
      const respuesta = await accion();
      onAviso('success', respuesta?.meta?.message || mensajeOk);
    } catch (err) {
      onAviso('error', err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      await refrescar(true);
      setOcupado(false);
    }
  };

  const cancelar = async () => {
    const confirmado = await confirmar({
      titulo: `Cancelar la campaña #${campania.id}`,
      mensaje: 'No se manda nada más (lo que ya salió queda en las estadísticas) y no se puede reanudar.',
      textoConfirmar: 'Cancelar la campaña',
      textoCancelar: 'Volver',
    });
    if (confirmado) void ejecutar(() => cancelarCampania(campania.id), 'Campaña cancelada');
  };

  /**
   * Informe PDF: trae la campaña y las estadísticas frescas (no las del estado, que pueden tener hasta 10 segundos de atraso) y
   * las listas de personas que hacen falta (de a 50, de a una), arma el modelo y recién ahí carga jspdf (import perezoso). Los
   * errores salen por el mismo aviso que las demás acciones de la pantalla. Si se cierra la pantalla en el medio, corta.
   */
  const descargarInforme = async () => {
    const cerrado = () => !montado.current;
    setArmandoInforme({ hechos: 0, total: null });
    try {
      const [actual, estadisticas] = await Promise.all([obtenerCampania(id), obtenerEstadisticas(id)]);
      if (cerrado()) return;
      const filtros = listasNecesarias(actual, estadisticas);
      const total = 1 + filtros.length;
      setArmandoInforme({ hechos: 1, total });
      const listas: ListasInforme = {};
      for (const [i, filtro] of filtros.entries()) {
        listas[filtro] = await traerTodasLasPersonas(id, filtro, topeParaFiltro(filtro), cerrado);
        if (cerrado()) return;
        setArmandoInforme({ hechos: i + 2, total });
      }
      const informe = armarInforme(actual, estadisticas, listas, new Date());
      const { descargarInformePdf } = await import('./informeCampania.pdf');
      if (await descargarInformePdf(informe, cerrado)) onAviso('success', `Informe descargado: ${informe.nombreArchivo}`);
    } catch (err) {
      if (!cerrado()) onAviso('error', `No se pudo armar el informe: ${err instanceof Error ? err.message : 'error de conexión'}`);
    } finally {
      if (montado.current) setArmandoInforme(null);
    }
  };

  const { canales } = campania;
  const esAfiliados = campania.tipoDestinatario === 'afiliados';

  const renderNumeros = (s: EstadisticasCampania) => {
    const vigentes = s.lista.OK ?? 0;
    const pushRecibida = s.push.recibieron + s.push.enBuzon;
    const mailAEnviar = s.mail.enviados + s.mail.pendientes + s.mail.errores;
    const { cruces } = s;
    const ambosCanales = canales.push && canales.mail;

    return (
      <>
        <div className="campanias-tarjetas">
          <Tarjeta titulo="Lista" subtitulo="Sobre todas las personas de la lista.">
            <Destacado valor={numero(s.total)} texto={s.total === 1 ? 'persona en la lista' : 'personas en la lista'} />
            <Fila etiqueta="Vigentes" cantidad={vigentes} base={s.total} ayuda="Les corresponde recibir la campaña" />
            {esAfiliados && (
              <>
                <Fila etiqueta="De baja en el padrón" cantidad={s.lista.BAJA_PADRON ?? 0} base={s.total} />
                <Fila etiqueta="No encontrados" cantidad={s.lista.NO_ENCONTRADO ?? 0} base={s.total} />
                {(s.lista.SIN_DNI ?? 0) > 0 && (
                  <Fila
                    etiqueta="Sin DNI ni CUIL"
                    cantidad={s.lista.SIN_DNI ?? 0}
                    base={s.total}
                    ayuda="No se pudieron cruzar con el padrón: no reciben nada"
                  />
                )}
              </>
            )}
            {(s.lista.QUITADO ?? 0) > 0 && (
              <Fila etiqueta="Quitados a mano" cantidad={s.lista.QUITADO ?? 0} base={s.total} ayuda="Se sacaron de la lista antes de enviar" />
            )}
          </Tarjeta>

          {esAfiliados && (
            <Tarjeta titulo="App" subtitulo="Sobre los vigentes.">
              <Fila etiqueta="Con la app" cantidad={s.app.conApp} base={vigentes} />
              <Fila etiqueta="Sin la app" cantidad={s.app.sinApp} base={vigentes} />
            </Tarjeta>
          )}

          {esAfiliados && (
            <Tarjeta titulo="Titulares y familiares" subtitulo="Sobre los vigentes.">
              <Fila etiqueta="Titulares" cantidad={s.parentesco.titulares} base={vigentes} />
              <Fila etiqueta="Familiares" cantidad={s.parentesco.familiares} base={vigentes} />
              {s.parentesco.sinDato > 0 && <Fila etiqueta="Sin dato" cantidad={s.parentesco.sinDato} base={vigentes} />}
            </Tarjeta>
          )}

          {canales.push && (
            <Tarjeta titulo="Push" subtitulo="Sobre los vigentes.">
              <Destacado valor={textoPorcentaje(s.push.leidas, pushRecibida)} texto={`de lectura: ${numero(s.push.leidas)} leyeron de ${numero(pushRecibida)} que la recibieron (en el celu o en el buzón)`} />
              <Fila etiqueta="Les llegó al celu" cantidad={s.push.recibieron} base={vigentes} />
              <Fila etiqueta="Quedó en el buzón de la app" cantidad={s.push.enBuzon} base={vigentes} ayuda="Tienen cuenta pero no un celular registrado" />
              <Fila etiqueta="Push apagada" cantidad={s.push.apagadas} base={vigentes} ayuda="Tienen las notificaciones apagadas: no les llegó" />
              <Fila etiqueta="Sin cuenta en la app" cantidad={s.push.sinCuenta} base={vigentes} />
              {s.push.sinCuil > 0 && <Fila etiqueta="Sin CUIL" cantidad={s.push.sinCuil} base={vigentes} />}
              {s.push.errores > 0 && <Fila etiqueta="Con error" cantidad={s.push.errores} base={vigentes} />}
              {s.push.pendientes > 0 && <Fila etiqueta="Todavía sin mandar" cantidad={s.push.pendientes} base={vigentes} />}
              {(s.push.inciertas ?? 0) > 0 && (
                <>
                  <Fila etiqueta="Incierto" cantidad={s.push.inciertas ?? 0} base={vigentes} />
                  <p className="campanias-ayuda">
                    {numero(s.push.inciertas ?? 0)} {s.push.inciertas === 1 ? 'push quedó incierta' : 'push quedaron inciertas'}: se cortó el
                    servidor en medio de una tanda, no se sabe si salieron y no se reenvían.
                  </p>
                </>
              )}
            </Tarjeta>
          )}

          {canales.mail && (
            <Tarjeta titulo="Mail">
              <Destacado
                valor={textoPorcentaje(s.mail.abiertos, s.mail.enviados)}
                texto={`de apertura: ${numero(s.mail.abiertos)} abrieron de ${numero(s.mail.enviados)} enviados`}
              />
              <Fila etiqueta="Enviados" cantidad={s.mail.enviados} base={mailAEnviar} ayuda="Sobre los que tienen que recibirlo (enviados, pendientes y con error)" />
              {s.mail.pendientes > 0 && <Fila etiqueta="Pendientes" cantidad={s.mail.pendientes} base={mailAEnviar} />}
              {s.mail.errores > 0 && <Fila etiqueta="Con error" cantidad={s.mail.errores} base={mailAEnviar} />}
              <Fila etiqueta="Abrieron" cantidad={s.mail.abiertos} base={s.mail.enviados} ayuda="Sobre los enviados" />
              <Fila etiqueta="Hicieron clic en el botón" cantidad={s.mail.clicks} base={s.mail.enviados} ayuda="Sobre los enviados" />
              <Fila etiqueta="Se dieron de baja" cantidad={s.mail.bajas} base={s.mail.enviados} ayuda="Sobre los enviados" />
              <p className="campanias-ayuda">
                {numero(s.mail.omitidos)} {s.mail.omitidos === 1 ? 'persona quedó afuera' : 'personas quedaron afuera'} del mail (sin mail,
                de baja, no encontradas o campaña cancelada). Abrieron, clic y baja se calculan sobre los enviados.
              </p>
            </Tarjeta>
          )}

          {canales.banner && (
            <Tarjeta titulo="Banner" subtitulo="Lo cuenta la app 7.1.6 en adelante.">
              <Fila etiqueta="Lo vieron" cantidad={s.banner.vieron} base={vigentes} ayuda="Sobre los vigentes" />
              <Fila etiqueta="Lo tocaron" cantidad={s.banner.tocaron} base={s.banner.vieron} ayuda="Sobre los que lo vieron" />
            </Tarjeta>
          )}
        </div>

        {(canales.push || canales.mail) && (esAfiliados || ambosCanales) && (
          <Tarjeta titulo="Cruces" subtitulo="Para ver quién llega por cada canal." ancha>
            {canales.mail && esAfiliados && (
              <p className="campanias-cruce">
                <strong>Sin app:</strong> de {numero(cruces.sinAppConMail.enviados)} que recibieron el mail, {numero(cruces.sinAppConMail.abrieron)} lo
                abrieron ({textoPorcentaje(cruces.sinAppConMail.abrieron, cruces.sinAppConMail.enviados)}).
              </p>
            )}
            {ambosCanales ? (
              <ul className="campanias-cruces-lista">
                <li>
                  <span className="campanias-cruce-numero">{numero(cruces.leyeronPushNoAbrieronMail)}</span>
                  <span>leyeron la push y no abrieron el mail</span>
                </li>
                <li>
                  <span className="campanias-cruce-numero">{numero(cruces.abrieronMailNoLeyeronPush)}</span>
                  <span>abrieron el mail y no leyeron la push</span>
                </li>
                <li>
                  <span className="campanias-cruce-numero">{numero(cruces.ambos)}</span>
                  <span>leyeron la push y abrieron el mail (ambos)</span>
                </li>
              </ul>
            ) : (
              <p className="campanias-ayuda">Los cruces entre push y mail aparecen cuando la campaña lleva los dos canales.</p>
            )}
            {esAfiliados && (canales.push || canales.mail) && (
              <div className="campanias-tabla-marco">
                <table className="campanias-tabla">
                  <caption className="campanias-tabla-titulo">Titulares y familiares</caption>
                  <thead>
                    <tr>
                      <th scope="col">Grupo</th>
                      <th scope="col">Personas</th>
                      {canales.push && <th scope="col">Leyeron la push</th>}
                      {canales.mail && <th scope="col">Abrieron el mail</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        { nombre: 'Titulares', datos: cruces.porParentesco.titulares },
                        { nombre: 'Familiares', datos: cruces.porParentesco.familiares },
                      ] as const
                    ).map(({ nombre, datos }) => (
                      <tr key={nombre}>
                        <th scope="row">{nombre}</th>
                        <td>{numero(datos.personas)}</td>
                        {canales.push && (
                          <td>
                            {numero(datos.leyeronPush)} ({textoPorcentaje(datos.leyeronPush, datos.personas)})
                          </td>
                        )}
                        {canales.mail && (
                          <td>
                            {numero(datos.abrieronMail)} ({textoPorcentaje(datos.abrieronMail, datos.personas)})
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tarjeta>
        )}

        <div className="campanias-notas">
          <strong>Cómo se mide</strong>
          <ul>
            {canales.push && (
              <li>Lectura de la push: cuenta cuando la persona la abre en el buzón de la app. El porcentaje es sobre los que la recibieron (en el celu o en el buzón).</li>
            )}
            {canales.mail && (
              <li>
                Apertura del mail: es aproximada. Se mide con una imagen invisible, así que Apple la infla (abre el mail solo al llegar) y
                quien bloquea las imágenes no aparece.
              </li>
            )}
            {canales.banner && <li>Banner: lo cuenta la app 7.1.6 en adelante; las versiones anteriores no avisan si lo vieron o lo tocaron.</li>}
            <li>El Excel trae una fila por persona con todas las fechas, para seguir a los que faltan por WhatsApp.</li>
          </ul>
        </div>
      </>
    );
  };

  return (
    <div className="campanias-modal-overlay">
      {ventanaConfirmacion}
      <div className="campanias-modal campanias-modal-grande" role="dialog" aria-modal="true" aria-labelledby="campanias-stats-titulo">
        <div className="campanias-modal-header">
          <h2 id="campanias-stats-titulo">
            Estadísticas · Campaña #{campania.id}
            <span className="campanias-modal-subtitulo"> · {campania.nombre}</span>
          </h2>
          <button type="button" className="campanias-icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="campanias-form">
          <div className="campanias-estado-barra">
            <div className="campanias-estado-info">
              <span className={`campanias-badge campanias-badge-${claseEstado(campania.estado)}`}>{etiquetaEstado(campania.estado)}</span>
              <span className="campanias-chips" aria-label="Canales">
                {canalesActivos(campania).map((canal) => (
                  <span key={canal.valor} className={`campanias-chip campanias-chip-${canal.valor}`}>
                    {canal.etiqueta}
                  </span>
                ))}
              </span>
              <span className="campanias-info-linea">
                {campania.tipoDestinatario === 'afiliados' ? 'Afiliados' : 'Prestadores'}
                {campania.enviadaAt ? ` · Enviada el ${fechaHora(campania.enviadaAt)}` : ''}
                {campania.terminadaAt ? ` · ${campania.estado === 'CANCELADA' ? 'Cancelada' : 'Terminó'} el ${fechaHora(campania.terminadaAt)}` : ''}
              </span>
            </div>
            <div className="campanias-estado-acciones">
              {campania.estado === 'ENVIANDO' && (
                <button
                  className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                  onClick={() => void ejecutar(() => pausarCampania(campania.id), 'Campaña pausada')}
                  disabled={ocupado}
                >
                  <FaPause /> Pausar
                </button>
              )}
              {campania.estado === 'PAUSADA' && (
                <button
                  className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                  onClick={() => void ejecutar(() => reanudarCampania(campania.id), 'Campaña reanudada')}
                  disabled={ocupado}
                >
                  <FaPlay /> Reanudar
                </button>
              )}
              {(campania.estado === 'ENVIANDO' || campania.estado === 'PAUSADA') && (
                <button className="campanias-btn campanias-btn-peligro campanias-btn-chico" onClick={cancelar} disabled={ocupado}>
                  <FaBan /> Cancelar
                </button>
              )}
              <button className="campanias-btn campanias-btn-secundario campanias-btn-chico" onClick={() => void refrescar()} disabled={cargando || ocupado}>
                <FaSync /> Actualizar
              </button>
              <a
                className="campanias-btn campanias-btn-primario campanias-btn-chico"
                href={urlExportarCampania(campania.id)}
                rel="noopener noreferrer"
                download
              >
                <FaDownload /> Descargar Excel
              </a>
              <button
                type="button"
                className="campanias-btn campanias-btn-primario campanias-btn-chico"
                onClick={() => void descargarInforme()}
                disabled={armandoInforme !== null}
                aria-busy={armandoInforme !== null}
                title="Resumen en PDF para mostrar: cifras por canal y la lista de quién abrió, quién leyó y quién pidió la baja"
              >
                <FaFilePdf />{' '}
                {armandoInforme
                  ? `Armando el informe…${armandoInforme.total ? ` ${armandoInforme.hechos} de ${armandoInforme.total}` : ''}`
                  : 'Descargar informe PDF'}
              </button>
            </div>
          </div>

          {campania.errorLista && campania.estado === 'PAUSADA' && <p className="campanias-error">{campania.errorLista}</p>}
          {enviando && (
            <p className="campanias-ayuda" role="status">
              Se está enviando: los números se actualizan solos cada 10 segundos
              {actualizadoAt ? ` (última vez: ${fechaHora(actualizadoAt)})` : ''}.
            </p>
          )}
          {error && <p className="campanias-error">{error}</p>}
          {!stats && !error && <p className="campanias-estado">Cargando estadísticas...</p>}

          {stats && renderNumeros(stats)}
          {stats && <CampaniaPersonas campania={campania} actualizadoAt={actualizadoAt} />}

          <div className="campanias-modal-acciones">
            <button type="button" className="campanias-btn campanias-btn-secundario" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaniaEstadisticas;
