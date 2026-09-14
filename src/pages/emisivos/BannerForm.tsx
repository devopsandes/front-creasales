// BannerForm.tsx — modal para crear o editar un banner de la App de Andes, con vista previa.

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import BannerPreview from './BannerPreview';
import { crearBanner, editarBanner } from './banner.api';
import type { Banner, DatosFormularioBanner } from './banner.api';
import { FAMILIAS_PLAN, LARGOS, PLANTILLAS, PROVINCIAS, errorDeImagen, linkLoAbreLaApp } from './bannerOpciones';

interface BannerFormProps {
  /** null = banner nuevo */
  banner: Banner | null;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}

type CampoTexto = 'etiqueta' | 'titulo' | 'texto' | 'textoBoton' | 'linkUrl' | 'vigenciaDesde' | 'vigenciaHasta';

const datosIniciales = (banner: Banner | null): DatosFormularioBanner => ({
  etiqueta: banner?.etiqueta ?? '',
  titulo: banner?.titulo ?? '',
  texto: banner?.texto ?? '',
  linkUrl: banner?.linkUrl ?? '',
  vigenciaDesde: banner?.vigenciaDesde ?? '',
  vigenciaHasta: banner?.vigenciaHasta ?? '',
  segmentacion: {
    planes: banner?.segmentacion?.planes ?? [],
    provincias: banner?.segmentacion?.provincias ?? [],
    edadMin: banner?.segmentacion?.edadMin ?? null,
    edadMax: banner?.segmentacion?.edadMax ?? null,
  },
  plantilla: banner?.plantilla ?? 'azul',
  textoBoton: banner?.textoBoton ?? '',
  mostrarCarita: banner?.mostrarCarita ?? false,
  imagen: null,
  quitarImagen: false,
});

const BannerForm = ({ banner, onCerrar, onGuardado }: BannerFormProps) => {
  const [datos, setDatos] = useState<DatosFormularioBanner>(() => datosIniciales(banner));
  const [urlImagenNueva, setUrlImagenNueva] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Vista previa de la imagen elegida: se libera al cambiarla o al cerrar el formulario.
  useEffect(() => {
    if (!datos.imagen) {
      setUrlImagenNueva(null);
      return;
    }
    const url = URL.createObjectURL(datos.imagen);
    setUrlImagenNueva(url);
    return () => URL.revokeObjectURL(url);
  }, [datos.imagen]);

  const cambiarTexto = (campo: CampoTexto) => (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const alternarOpcion = (lista: 'planes' | 'provincias', valor: string) => {
    setDatos((prev) => {
      const actual = prev.segmentacion[lista];
      const nueva = actual.includes(valor) ? actual.filter((item) => item !== valor) : [...actual, valor];
      return { ...prev, segmentacion: { ...prev.segmentacion, [lista]: nueva } };
    });
  };

  // "Todos" = lista vacía = sin filtro (mismo criterio que "Crear Notificaciones"): si mañana aparece un
  // plan o una provincia nueva, también lo ve. Marcar un plan puntual desmarca "Todos".
  const marcarTodos = (lista: 'planes' | 'provincias') => {
    setDatos((prev) => ({ ...prev, segmentacion: { ...prev.segmentacion, [lista]: [] } }));
  };

  const cambiarEdad = (campo: 'edadMin' | 'edadMax') => (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setDatos((prev) => ({
      ...prev,
      segmentacion: { ...prev.segmentacion, [campo]: valor === '' ? null : Number(valor) },
    }));
  };

  const elegirImagen = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    const problema = errorDeImagen(archivo);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setDatos((prev) => ({ ...prev, imagen: archivo, quitarImagen: false }));
  };

  const quitarImagen = () => {
    setDatos((prev) => ({ ...prev, imagen: null, quitarImagen: Boolean(banner?.tieneImagen) }));
  };

  // La imagen que se va a ver: la recién elegida, o la que ya tenía (si no la quitaron).
  const imagenVista = urlImagenNueva ?? (!datos.quitarImagen && banner?.imagenUrl ? banner.imagenUrl : null);
  const linkNoLoAbreLaApp = datos.linkUrl.trim() !== '' && !linkLoAbreLaApp(datos.linkUrl.trim());

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!datos.titulo.trim() && !imagenVista) {
      setError('El banner necesita un título o una imagen.');
      return;
    }
    if (linkNoLoAbreLaApp) {
      setError('El link tiene que ser de andessalud.com.ar o andessalud.ar (con https://).');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const respuesta = banner ? await editarBanner(banner.id, datos) : await crearBanner(datos);
      onGuardado(respuesta.meta?.message || (banner ? 'Banner actualizado' : 'Banner creado'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setGuardando(false);
    }
  };

  return (
    <div className="banner-modal-overlay">
      <div className="banner-modal" role="dialog" aria-modal="true" aria-labelledby="banner-modal-titulo">
        <div className="banner-modal-header">
          <h2 id="banner-modal-titulo">{banner ? `Editar banner #${banner.id}` : 'Nuevo banner'}</h2>
          <button type="button" className="banner-icon-btn" onClick={onCerrar} aria-label="Cerrar" disabled={guardando}>
            <FaTimes />
          </button>
        </div>

        <form className="banner-form" onSubmit={guardar}>
          <div className="banner-form-columnas">
            <div className="banner-form-campos">
              <label className="banner-label">
                Etiqueta <span className="banner-ayuda">(opcional, ej. NOVEDAD)</span>
                <input className="banner-input" maxLength={LARGOS.etiqueta} value={datos.etiqueta} onChange={cambiarTexto('etiqueta')} />
              </label>

              <label className="banner-label">
                Título <span className="banner-ayuda">(obligatorio si no hay imagen)</span>
                <input className="banner-input" maxLength={LARGOS.titulo} value={datos.titulo} onChange={cambiarTexto('titulo')} />
              </label>

              <label className="banner-label">
                Texto <span className="banner-ayuda">(opcional, una línea corta)</span>
                <input className="banner-input" maxLength={LARGOS.texto} value={datos.texto} onChange={cambiarTexto('texto')} />
              </label>

              <label className="banner-label">
                Link <span className="banner-ayuda">(opcional, se abre al tocar el banner)</span>
                <input
                  className="banner-input"
                  type="url"
                  placeholder="https://"
                  value={datos.linkUrl}
                  onChange={cambiarTexto('linkUrl')}
                />
              </label>
              {linkNoLoAbreLaApp && (
                <p className="banner-aviso">
                  El link tiene que empezar con https:// y ser de andessalud.com.ar o andessalud.ar. La app no abre otros sitios
                  desde un banner y no se va a poder guardar.
                </p>
              )}

              <label className="banner-label">
                Texto del botón <span className="banner-ayuda">(opcional, ej. Solicitalo)</span>
                <input className="banner-input" maxLength={LARGOS.textoBoton} value={datos.textoBoton} onChange={cambiarTexto('textoBoton')} />
              </label>
              {datos.textoBoton.trim() !== '' && !linkLoAbreLaApp(datos.linkUrl.trim()) && (
                <p className="banner-aviso">El botón solo se muestra si el banner tiene un link de Andes.</p>
              )}

              <div className="banner-label">
                Diseño <span className="banner-ayuda">(se usa cuando el banner no tiene imagen)</span>
                <div className="banner-plantillas">
                  {PLANTILLAS.map((opcion) => (
                    <button
                      type="button"
                      key={opcion.valor}
                      className={`banner-plantilla-opcion ${datos.plantilla === opcion.valor ? 'banner-plantilla-opcion-activa' : ''}`}
                      onClick={() => setDatos((prev) => ({ ...prev, plantilla: opcion.valor }))}
                      aria-pressed={datos.plantilla === opcion.valor}
                    >
                      <span className={`banner-plantilla-muestra banner-plantilla-${opcion.valor}`} />
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
              </div>

              <label className="banner-check">
                <input
                  type="checkbox"
                  checked={datos.mostrarCarita}
                  onChange={(e) => {
                    const mostrar = e.target.checked;
                    setDatos((prev) => ({ ...prev, mostrarCarita: mostrar }));
                  }}
                />
                Mostrar la carita de Andes
              </label>

              <label className="banner-label">
                Imagen <span className="banner-ayuda">(JPG, PNG o WEBP, hasta 1 MB, ideal 1200×430)</span>
                <input className="banner-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirImagen} />
              </label>
              {imagenVista && (
                <button type="button" className="banner-btn banner-btn-secundario banner-btn-chico" onClick={quitarImagen}>
                  Quitar imagen
                </button>
              )}
              <p className="banner-ayuda">
                Con imagen, la app muestra solo la imagen (sin diseño, etiqueta, título, texto, botón ni carita).
              </p>

              <div className="banner-fila">
                <label className="banner-label">
                  Se muestra desde
                  <input className="banner-input" type="date" value={datos.vigenciaDesde} onChange={cambiarTexto('vigenciaDesde')} />
                </label>
                <label className="banner-label">
                  Hasta (inclusive)
                  <input className="banner-input" type="date" value={datos.vigenciaHasta} onChange={cambiarTexto('vigenciaHasta')} />
                </label>
              </div>

              <fieldset className="banner-fieldset">
                <legend>¿A quién le sale?</legend>
                <p className="banner-ayuda">Con "Todos" marcado, no se filtra por eso.</p>

                <span className="banner-sublabel">Planes</span>
                <div className="banner-checks">
                  <label className="banner-check banner-check-todos">
                    <input
                      type="checkbox"
                      checked={datos.segmentacion.planes.length === 0}
                      onChange={() => marcarTodos('planes')}
                    />
                    Todos
                  </label>
                  {FAMILIAS_PLAN.map((plan) => (
                    <label key={plan.valor} className="banner-check">
                      <input
                        type="checkbox"
                        checked={datos.segmentacion.planes.includes(plan.valor)}
                        onChange={() => alternarOpcion('planes', plan.valor)}
                      />
                      {plan.etiqueta}
                    </label>
                  ))}
                </div>

                <span className="banner-sublabel">Provincias</span>
                <div className="banner-checks">
                  <label className="banner-check banner-check-todos">
                    <input
                      type="checkbox"
                      checked={datos.segmentacion.provincias.length === 0}
                      onChange={() => marcarTodos('provincias')}
                    />
                    Todas
                  </label>
                  {PROVINCIAS.map((provincia) => (
                    <label key={provincia.valor} className="banner-check">
                      <input
                        type="checkbox"
                        checked={datos.segmentacion.provincias.includes(provincia.valor)}
                        onChange={() => alternarOpcion('provincias', provincia.valor)}
                      />
                      {provincia.etiqueta}
                    </label>
                  ))}
                </div>

                <div className="banner-fila">
                  <label className="banner-label">
                    Edad mínima
                    <input
                      className="banner-input"
                      type="number"
                      min={0}
                      max={120}
                      value={datos.segmentacion.edadMin ?? ''}
                      onChange={cambiarEdad('edadMin')}
                    />
                  </label>
                  <label className="banner-label">
                    Edad máxima
                    <input
                      className="banner-input"
                      type="number"
                      min={0}
                      max={120}
                      value={datos.segmentacion.edadMax ?? ''}
                      onChange={cambiarEdad('edadMax')}
                    />
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="banner-form-preview">
              <span className="banner-sublabel">Vista previa en la app</span>
              <BannerPreview
                etiqueta={datos.etiqueta}
                titulo={datos.titulo}
                texto={datos.texto}
                imagenUrl={imagenVista}
                plantilla={datos.plantilla}
                textoBoton={datos.textoBoton}
                mostrarCarita={datos.mostrarCarita}
                conLink={linkLoAbreLaApp(datos.linkUrl.trim())}
              />
            </div>
          </div>

          {error && <p className="banner-error">{error}</p>}

          <div className="banner-modal-acciones">
            <button type="button" className="banner-btn banner-btn-secundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="banner-btn banner-btn-primario" disabled={guardando}>
              <FaSave /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerForm;
