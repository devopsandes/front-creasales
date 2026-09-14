// Banner.tsx — pestaña "Banner" de Emisivos: banners del Home de la App de Andes Salud.
// Pedido de Gino (14/09/2026): pestaña propia, separada de las otras pantallas de Emisivos.
// Backend: rutas /banners de emisivos (docs/banners.md en el repo de Emisivos).

import { useCallback, useEffect, useState } from 'react';
import {
  FaArrowDown,
  FaArrowUp,
  FaCheckCircle,
  FaEdit,
  FaPause,
  FaPlay,
  FaPlus,
  FaSync,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import BannerForm from './BannerForm';
import BannerPreview from './BannerPreview';
import { borrarBanner, cambiarActivoBanner, listarBanners, reordenarBanners } from './banner.api';
import type { Banner as BannerItem } from './banner.api';
import { linkLoAbreLaApp, nombrePlantilla, resumenSegmentacion, textoVigencia } from './bannerOpciones';
import './Banner.css';

interface EstadoFormulario {
  abierto: boolean;
  /** null = banner nuevo */
  banner: BannerItem | null;
}

const Banner = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [formulario, setFormulario] = useState<EstadoFormulario>({ abierto: false, banner: null });

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
      setBanners(await listarBanners());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Corre una acción sobre emisivos, avisa el resultado y vuelve a cargar el listado. */
  const ejecutar = async (accion: () => Promise<unknown>, mensajeOk: string) => {
    setOcupado(true);
    try {
      await accion();
      showToastMessage('success', mensajeOk);
      await cargar();
    } catch (err) {
      showToastMessage('error', err instanceof Error ? err.message : 'Error de conexión');
      // Revisión 14/09: la lista pudo quedar vieja (ej. otra operadora borró un banner): se recarga igual.
      await cargar();
    } finally {
      setOcupado(false);
    }
  };

  const mover = (indice: number, direccion: -1 | 1) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= banners.length) return;
    const ids = banners.map((banner) => banner.id);
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    void ejecutar(() => reordenarBanners(ids), 'Orden actualizado');
  };

  const alternarActivo = (banner: BannerItem) => {
    void ejecutar(() => cambiarActivoBanner(banner.id, !banner.activo), banner.activo ? 'Banner pausado' : 'Banner activado');
  };

  const borrar = (banner: BannerItem) => {
    const confirmado = window.confirm(
      `¿Seguro que querés borrar el banner #${banner.id}? Deja de verse en la app y no se puede recuperar.`,
    );
    if (!confirmado) return;
    void ejecutar(() => borrarBanner(banner.id), 'Banner borrado');
  };

  const alGuardar = (mensaje: string) => {
    setFormulario({ abierto: false, banner: null });
    showToastMessage('success', mensaje);
    void cargar();
  };

  return (
    <div className="banner-container">
      <div className="banner-header">
        <div>
          <h1 className="banner-title">Banners de la App</h1>
          <p className="banner-subtitle">
            Se muestran en el inicio de la App de Andes Salud, rotando en este orden. A cada afiliado le salen solo los que le
            corresponden por plan, edad y provincia, y dentro de sus fechas.
          </p>
        </div>
        <div className="banner-header-acciones">
          <button className="banner-btn banner-btn-secundario" onClick={() => void cargar()} disabled={cargando || ocupado}>
            <FaSync /> Actualizar
          </button>
          <button className="banner-btn banner-btn-primario" onClick={() => setFormulario({ abierto: true, banner: null })}>
            <FaPlus /> Nuevo banner
          </button>
        </div>
      </div>

      {error && <div className="banner-error">{error}</div>}
      {cargando && banners.length === 0 && <p className="banner-estado">Cargando banners...</p>}
      {!cargando && !error && banners.length === 0 && (
        <p className="banner-estado">Todavía no hay banners. Creá el primero con "Nuevo banner".</p>
      )}

      <ul className="banner-lista">
        {banners.map((banner, indice) => (
          <li key={banner.id} className={`banner-item ${banner.activo ? '' : 'banner-item-pausado'}`}>
            <div className="banner-orden">
              <button
                className="banner-icon-btn"
                onClick={() => mover(indice, -1)}
                disabled={ocupado || indice === 0}
                aria-label="Subir en el carrusel"
              >
                <FaArrowUp />
              </button>
              <span className="banner-orden-numero">{indice + 1}</span>
              <button
                className="banner-icon-btn"
                onClick={() => mover(indice, 1)}
                disabled={ocupado || indice === banners.length - 1}
                aria-label="Bajar en el carrusel"
              >
                <FaArrowDown />
              </button>
            </div>

            <BannerPreview
              etiqueta={banner.etiqueta}
              titulo={banner.titulo}
              texto={banner.texto}
              imagenUrl={banner.imagenUrl}
              plantilla={banner.plantilla}
              textoBoton={banner.textoBoton}
              mostrarCarita={banner.mostrarCarita}
              conLink={Boolean(banner.linkUrl && linkLoAbreLaApp(banner.linkUrl))}
            />

            <div className="banner-info">
              <div className="banner-info-titulo">
                <span>
                  #{banner.id} {banner.titulo || (banner.tieneImagen ? 'Banner con imagen' : 'Sin título')}
                </span>
                <span className={`banner-badge ${banner.activo ? 'banner-badge-activo' : 'banner-badge-pausado'}`}>
                  {banner.activo ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <div className="banner-info-linea">{textoVigencia(banner.vigenciaDesde, banner.vigenciaHasta)}</div>
              <div className="banner-info-linea">{resumenSegmentacion(banner.segmentacion)}</div>
              <div className="banner-info-linea">
                {banner.tieneImagen
                  ? 'Diseño: imagen propia'
                  : `Diseño: ${nombrePlantilla(banner.plantilla)}${banner.textoBoton ? ` · Botón: ${banner.textoBoton}` : ''}${banner.mostrarCarita ? ' · Con carita' : ''}`}
              </div>
              {banner.linkUrl && <div className="banner-info-linea banner-info-link">Link: {banner.linkUrl}</div>}
            </div>

            <div className="banner-acciones">
              <button
                className="banner-btn banner-btn-secundario banner-btn-chico"
                onClick={() => setFormulario({ abierto: true, banner })}
                disabled={ocupado}
              >
                <FaEdit /> Editar
              </button>
              <button
                className="banner-btn banner-btn-secundario banner-btn-chico"
                onClick={() => alternarActivo(banner)}
                disabled={ocupado}
              >
                {banner.activo ? (
                  <>
                    <FaPause /> Pausar
                  </>
                ) : (
                  <>
                    <FaPlay /> Activar
                  </>
                )}
              </button>
              <button className="banner-btn banner-btn-peligro banner-btn-chico" onClick={() => borrar(banner)} disabled={ocupado}>
                <FaTrash /> Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {formulario.abierto && (
        <BannerForm
          banner={formulario.banner}
          onCerrar={() => setFormulario({ abierto: false, banner: null })}
          onGuardado={alGuardar}
        />
      )}

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

export default Banner;
