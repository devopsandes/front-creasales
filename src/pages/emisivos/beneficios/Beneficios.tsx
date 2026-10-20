// Beneficios.tsx — pestaña "Beneficios" de Emisivos: tarjetas de beneficios de la App de Andes Salud.
// Backend: rutas /beneficios de emisivos (tope de 60 beneficios).

import { useCallback, useEffect, useState } from 'react';
import { FaCheckCircle, FaEdit, FaPause, FaPlay, FaPlus, FaSync, FaTimesCircle, FaTrash } from 'react-icons/fa';
import { FAMILIAS_PLAN, FILTRO_VACIO, PROVINCIAS, esLinkWhatsApp, hayFiltro, resumenSegmentacion, textoVigencia } from '../bannerOpciones';
import type { FiltroBanners } from '../bannerOpciones';
import { useConfirmacion } from '../useConfirmacion';
import BeneficioForm from './BeneficioForm';
import BeneficioPreview from './BeneficioPreview';
import { TOPE_BENEFICIOS, borrarBeneficio, cambiarActivoBeneficio, listarBeneficios } from './beneficios.api';
import type { Beneficio } from './beneficios.api';
import {
  beneficioAplicaA,
  linkLoAbreLaAppBeneficio,
  segmentacionCompleta,
  textoUbicacion,
  urlVerEnMaps,
  urlBuscarEnMaps,
  tieneComoLlegar,
} from './beneficiosOpciones';
import './Beneficios.css';

interface EstadoFormulario {
  abierto: boolean;
  /** null = beneficio nuevo */
  beneficio: Beneficio | null;
}

const Beneficios = () => {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [formulario, setFormulario] = useState<EstadoFormulario>({ abierto: false, beneficio: null });
  const [filtro, setFiltro] = useState<FiltroBanners>(FILTRO_VACIO);
  const { confirmar, ventanaConfirmacion } = useConfirmacion();

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setBeneficios(await listarBeneficios());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Corre una acción sobre emisivos, avisa el resultado y vuelve a cargar el listado (también si falló). */
  const ejecutar = async (accion: () => Promise<unknown>, mensajeOk: string) => {
    setOcupado(true);
    try {
      await accion();
      showToastMessage('success', mensajeOk);
      await cargar();
    } catch (err) {
      showToastMessage('error', err instanceof Error ? err.message : 'Error de conexión');
      // La lista pudo quedar vieja (ej. otra operadora borró un beneficio): se recarga igual.
      await cargar();
    } finally {
      setOcupado(false);
    }
  };

  const alternarActivo = (beneficio: Beneficio) => {
    void ejecutar(
      () => cambiarActivoBeneficio(beneficio.id, !beneficio.activo),
      beneficio.activo ? 'Beneficio pausado' : 'Beneficio activado',
    );
  };

  const borrar = async (beneficio: Beneficio) => {
    const confirmado = await confirmar({
      titulo: `Borrar el beneficio #${beneficio.id}`,
      mensaje: 'Deja de verse en la app y no se puede recuperar.',
      textoConfirmar: 'Borrar',
    });
    if (!confirmado) return;
    void ejecutar(() => borrarBeneficio(beneficio.id), 'Beneficio borrado');
  };

  const alGuardar = (mensaje: string) => {
    setFormulario({ abierto: false, beneficio: null });
    showToastMessage('success', mensaje);
    void cargar();
  };

  // Con un filtro puesto se ven solo los beneficios que le salen a ese afiliado. La prioridad se cambia en Editar.
  const filtrando = hayFiltro(filtro);
  const visibles = beneficios.filter((beneficio) => beneficioAplicaA(beneficio, filtro));
  const enElTope = beneficios.length >= TOPE_BENEFICIOS;

  return (
    <div className="beneficio-container">
      <div className="beneficio-header">
        <div>
          <h1 className="beneficio-title">Beneficios de la App</h1>
          <p className="beneficio-subtitle">
            Tarjetas de beneficios para los afiliados, ordenadas por prioridad. A cada afiliado le salen solo las que le
            corresponden por plan, edad y provincia, y dentro de sus fechas. Se pueden cargar hasta {TOPE_BENEFICIOS} (hay{' '}
            {beneficios.length}).
          </p>
        </div>
        <div className="beneficio-header-acciones">
          <button className="beneficio-btn beneficio-btn-secundario" onClick={() => void cargar()} disabled={cargando || ocupado}>
            <FaSync /> Actualizar
          </button>
          <button
            className="beneficio-btn beneficio-btn-primario"
            onClick={() => setFormulario({ abierto: true, beneficio: null })}
            disabled={enElTope}
            title={enElTope ? `Ya hay ${TOPE_BENEFICIOS} beneficios (el tope)` : undefined}
          >
            <FaPlus /> Nuevo beneficio
          </button>
        </div>
      </div>

      {enElTope && (
        <p className="beneficio-aviso beneficio-aviso-tope">
          Llegaste al tope de {TOPE_BENEFICIOS} beneficios. Para cargar uno nuevo, borrá alguno que ya no se use.
        </p>
      )}

      <div className="beneficio-filtros">
        <div className="beneficio-filtro-grupo">
          <span className="beneficio-sublabel">Provincia</span>
          <div className="beneficio-pastillas">
            {[{ valor: '', etiqueta: 'Todas' }, ...PROVINCIAS].map((opcion) => (
              <button
                type="button"
                key={opcion.valor || 'todas'}
                className={`beneficio-pastilla ${filtro.provincia === opcion.valor ? 'beneficio-pastilla-activa' : ''}`}
                onClick={() => setFiltro((actual) => ({ ...actual, provincia: opcion.valor }))}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>
        <div className="beneficio-filtro-grupo">
          <span className="beneficio-sublabel">Plan</span>
          <div className="beneficio-pastillas">
            {[{ valor: '', etiqueta: 'Todos' }, ...FAMILIAS_PLAN].map((opcion) => (
              <button
                type="button"
                key={opcion.valor || 'todos'}
                className={`beneficio-pastilla ${filtro.plan === opcion.valor ? 'beneficio-pastilla-activa' : ''}`}
                onClick={() => setFiltro((actual) => ({ ...actual, plan: opcion.valor }))}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>
        <label className="beneficio-filtro-grupo">
          <span className="beneficio-sublabel">Edad del afiliado</span>
          <input
            className="beneficio-input beneficio-input-corto"
            type="number"
            min={0}
            max={120}
            placeholder="Todas"
            value={filtro.edad}
            onChange={(e) => {
              const edad = e.target.value;
              setFiltro((actual) => ({ ...actual, edad }));
            }}
          />
        </label>
        {filtrando && (
          <button
            type="button"
            className="beneficio-btn beneficio-btn-secundario beneficio-btn-chico"
            onClick={() => setFiltro(FILTRO_VACIO)}
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {filtrando && (
        <p className="beneficio-ayuda beneficio-filtro-resumen">
          Mostrando {visibles.length} de {beneficios.length}: los que le salen a ese afiliado (incluye los que son para todos).
        </p>
      )}

      {error && <div className="beneficio-error">{error}</div>}
      {cargando && beneficios.length === 0 && <p className="beneficio-estado">Cargando beneficios...</p>}
      {!cargando && !error && beneficios.length === 0 && (
        <p className="beneficio-estado">Todavía no hay beneficios. Creá el primero con "Nuevo beneficio".</p>
      )}
      {!cargando && beneficios.length > 0 && visibles.length === 0 && (
        <p className="beneficio-estado">Con esos filtros no le sale ningún beneficio a ese afiliado.</p>
      )}

      <ul className="beneficio-lista">
        {visibles.map((beneficio) => {
          const tieneUbicacion = tieneComoLlegar(beneficio.lat, beneficio.lng, beneficio.direccion);
          const urlMaps = beneficio.lat !== null && beneficio.lng !== null
            ? urlVerEnMaps(beneficio.lat, beneficio.lng)
            : beneficio.direccion?.trim() ? urlBuscarEnMaps(beneficio.direccion) : null;
          return (
            <li key={beneficio.id} className={`beneficio-item ${beneficio.activo ? '' : 'beneficio-item-pausado'}`}>
              <BeneficioPreview
                titulo={beneficio.titulo}
                descripcion={beneficio.descripcion}
                imagenUrl={beneficio.imagenUrl}
                direccion={beneficio.direccion}
                masInfo={linkLoAbreLaAppBeneficio(beneficio.linkUrl)}
                comoLlegar={tieneUbicacion}
              />

              <div className="beneficio-info">
                <div className="beneficio-info-titulo">
                  <span>
                    #{beneficio.id} {beneficio.titulo || (beneficio.tieneImagen ? 'Beneficio con imagen' : 'Sin título')}
                  </span>
                  <span className={`beneficio-badge ${beneficio.activo ? 'beneficio-badge-activo' : 'beneficio-badge-pausado'}`}>
                    {beneficio.activo ? 'Activo' : 'Pausado'}
                  </span>
                  {beneficio.cantidadDnis > 0 && (
                    <span className="beneficio-badge beneficio-badge-dnis">
                      Lista de {beneficio.cantidadDnis} {beneficio.cantidadDnis === 1 ? 'DNI' : 'DNIs'}
                    </span>
                  )}
                </div>
                <div className="beneficio-info-linea">Prioridad: {beneficio.orden}</div>
                <div className="beneficio-info-linea">{textoVigencia(beneficio.vigenciaDesde, beneficio.vigenciaHasta)}</div>
                <div className="beneficio-info-linea">
                  {resumenSegmentacion(beneficio.segmentacion ? segmentacionCompleta(beneficio.segmentacion) : null)}
                </div>
                <div className="beneficio-info-linea">
                  {textoUbicacion(beneficio)}
                  {urlMaps && (
                    <>
                      {' · '}
                      <a
                        className="beneficio-enlace"
                        href={urlMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver en Maps
                      </a>
                    </>
                  )}
                </div>
                {beneficio.linkUrl && (
                  <div className="beneficio-info-linea beneficio-info-link">
                    {esLinkWhatsApp(beneficio.linkUrl) ? 'Abre WhatsApp' : 'Link'}: {beneficio.linkUrl}
                  </div>
                )}
              </div>

              <div className="beneficio-acciones">
                <button
                  className="beneficio-btn beneficio-btn-secundario beneficio-btn-chico"
                  onClick={() => setFormulario({ abierto: true, beneficio })}
                  disabled={ocupado}
                >
                  <FaEdit /> Editar
                </button>
                <button
                  className="beneficio-btn beneficio-btn-secundario beneficio-btn-chico"
                  onClick={() => alternarActivo(beneficio)}
                  disabled={ocupado}
                >
                  {beneficio.activo ? (
                    <>
                      <FaPause /> Pausar
                    </>
                  ) : (
                    <>
                      <FaPlay /> Activar
                    </>
                  )}
                </button>
                <button
                  className="beneficio-btn beneficio-btn-peligro beneficio-btn-chico"
                  onClick={() => void borrar(beneficio)}
                  disabled={ocupado}
                >
                  <FaTrash /> Borrar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {formulario.abierto && (
        <BeneficioForm
          beneficio={formulario.beneficio}
          onCerrar={() => setFormulario({ abierto: false, beneficio: null })}
          onGuardado={alGuardar}
        />
      )}

      {ventanaConfirmacion}

      {showToast && (
        <div className={`emisivos-toast ${toastType === 'success' ? 'emisivos-toast-success' : 'emisivos-toast-error'}`}>
          <div className="emisivos-toast-content">
            {toastType === 'success' ? <FaCheckCircle className="emisivos-toast-icon" /> : <FaTimesCircle className="emisivos-toast-icon" />}
            <span className="emisivos-toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beneficios;
