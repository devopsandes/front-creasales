// BeneficioForm.tsx — modal para crear o editar un beneficio de la App de Andes, con vista previa en vivo.

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FaMapMarkerAlt, FaSave, FaTimes } from 'react-icons/fa';
import BeneficioPreview from './BeneficioPreview';
import { crearBeneficio, editarBeneficio, ubicacionDesdeLink } from './beneficios.api';
import type { Beneficio, DatosFormularioBeneficio } from './beneficios.api';
import {
  LARGOS,
  PRIORIDAD_MAX,
  PRIORIDAD_MIN,
  coordenadasValidas,
  errorDeBeneficio,
  errorDeCoordenadas,
  errorDeEdades,
  errorDeFechas,
  errorDeLink,
  errorDePrioridad,
  linkLoAbreLaAppBeneficio,
  segmentacionCompleta,
  urlVerEnMaps,
} from './beneficiosOpciones';
import { ACEPTA_DNIS, FAMILIAS_PLAN, PROVINCIAS, errorDeArchivoDnis, errorDeImagen } from '../bannerOpciones';

interface BeneficioFormProps {
  /** null = beneficio nuevo */
  beneficio: Beneficio | null;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}

type ModoDnis = 'archivo' | 'texto';

type CampoTexto = 'titulo' | 'direccion' | 'linkUrl' | 'lat' | 'lng' | 'vigenciaDesde' | 'vigenciaHasta' | 'orden';

const datosIniciales = (beneficio: Beneficio | null): DatosFormularioBeneficio => ({
  titulo: beneficio?.titulo ?? '',
  descripcion: beneficio?.descripcion ?? '',
  linkUrl: beneficio?.linkUrl ?? '',
  direccion: beneficio?.direccion ?? '',
  lat: beneficio?.lat != null ? String(beneficio.lat) : '',
  lng: beneficio?.lng != null ? String(beneficio.lng) : '',
  vigenciaDesde: beneficio?.vigenciaDesde ?? '',
  vigenciaHasta: beneficio?.vigenciaHasta ?? '',
  segmentacion: segmentacionCompleta(beneficio?.segmentacion),
  orden: beneficio ? String(beneficio.orden) : '',
  imagen: null,
  quitarImagen: false,
  archivoDnis: null,
  dnisTexto: '',
  quitarDnis: false,
});

const BeneficioForm = ({ beneficio, onCerrar, onGuardado }: BeneficioFormProps) => {
  const [datos, setDatos] = useState<DatosFormularioBeneficio>(() => datosIniciales(beneficio));
  const [urlImagenNueva, setUrlImagenNueva] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Ubicación: el link de Google Maps es solo para leer las coordenadas, no se guarda.
  const [linkMaps, setLinkMaps] = useState('');
  const [leyendo, setLeyendo] = useState(false);
  const [avisoUbicacion, setAvisoUbicacion] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

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

  // "Todos" = lista vacía = sin filtro (igual que en Banner): si mañana aparece un plan o una provincia nueva, también lo ve.
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
    setDatos((prev) => ({ ...prev, imagen: null, quitarImagen: Boolean(beneficio?.tieneImagen) }));
  };

  // Lista de DNIs: se sube el archivo o se pegan los DNIs, uno u otro (al elegir uno se descarta el otro). Emisivos los lee al guardar.
  const [modoDnis, setModoDnis] = useState<ModoDnis>('archivo');
  const cambiarModoDnis = (modo: ModoDnis) => {
    setModoDnis(modo);
    setDatos((prev) => ({ ...prev, archivoDnis: null, dnisTexto: '' }));
  };

  const elegirArchivoDnis = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    const problema = errorDeArchivoDnis(archivo);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setDatos((prev) => ({ ...prev, archivoDnis: archivo, dnisTexto: '', quitarDnis: false }));
  };

  const quitarListaDnis = () => {
    setDatos((prev) => ({ ...prev, archivoDnis: null, dnisTexto: '', quitarDnis: (beneficio?.cantidadDnis ?? 0) > 0 }));
  };

  const leerUbicacion = async () => {
    if (!linkMaps.trim()) {
      setAvisoUbicacion({ tipo: 'error', texto: 'Pegá primero el link de Google Maps.' });
      return;
    }
    setLeyendo(true);
    setAvisoUbicacion(null);
    try {
      const { lat, lng, direccion } = await ubicacionDesdeLink(linkMaps);
      const hayCoordenadas = lat !== null && lng !== null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
      const direccionLeida = direccion?.trim() ?? '';
      if (!hayCoordenadas && !direccionLeida) throw new Error('No se pudo leer la ubicación de ese link.');
      // La dirección del link solo completa el campo si está vacío: no pisa lo que escribió la operadora.
      setDatos((prev) => ({
        ...prev,
        lat: hayCoordenadas ? String(Number(lat)) : '',
        lng: hayCoordenadas ? String(Number(lng)) : '',
        direccion: prev.direccion.trim() ? prev.direccion : direccionLeida,
      }));
      setAvisoUbicacion(hayCoordenadas
        ? { tipo: 'ok', texto: 'Ubicación leída. Revisala con "Ver en Maps" antes de guardar.' }
        // Links compartidos desde el celu: Google no manda las coordenadas, solo el lugar (16/10/2026).
        : {
          tipo: 'ok',
          texto: `Ese link no trae las coordenadas exactas, solo el lugar: "${direccionLeida}". "Cómo llegar" va a buscar la dirección en Google Maps. Si querés que la app muestre la distancia, cargá la latitud y la longitud a mano.`,
        });
    } catch (err) {
      // Si no se pudo leer, queda cargar latitud y longitud a mano.
      const motivo = (err instanceof Error ? err.message : 'Error de conexión').trim();
      const punto = /[.!?]$/.test(motivo) ? '' : '.';
      setAvisoUbicacion({ tipo: 'error', texto: `${motivo}${punto} Podés cargar la latitud y la longitud a mano.` });
    } finally {
      setLeyendo(false);
    }
  };

  const quitarUbicacion = () => {
    setDatos((prev) => ({ ...prev, lat: '', lng: '' }));
    setLinkMaps('');
    setAvisoUbicacion(null);
  };

  // La imagen que se va a ver: la recién elegida, o la que ya tenía (si no la quitaron).
  const imagenVista = urlImagenNueva ?? (!datos.quitarImagen && beneficio?.imagenUrl ? beneficio.imagenUrl : null);
  const coordenadas = coordenadasValidas(datos.lat, datos.lng);

  // Lo que va a quedar guardado: el archivo o los DNIs pegados recién, o la lista que ya tenía (si no la quitaron).
  const dnisGuardados = !datos.quitarDnis ? (beneficio?.cantidadDnis ?? 0) : 0;
  const listaNueva = Boolean(datos.archivoDnis) || datos.dnisTexto.trim() !== '';
  const tieneListaDnis = listaNueva || dnisGuardados > 0;

  const problemaLink = errorDeLink(datos.linkUrl);
  const problemaCoordenadas = errorDeCoordenadas(datos.lat, datos.lng);
  const problemaFechas = errorDeFechas(datos.vigenciaDesde, datos.vigenciaHasta);
  const problemaPrioridad = errorDePrioridad(datos.orden);
  const problemaEdades = errorDeEdades(datos.segmentacion);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const problema = errorDeBeneficio(datos, Boolean(imagenVista));
    if (problema) {
      setError(problema);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const respuesta = beneficio ? await editarBeneficio(beneficio.id, datos) : await crearBeneficio(datos);
      onGuardado(respuesta.meta?.message || (beneficio ? 'Beneficio actualizado' : 'Beneficio creado'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setGuardando(false);
    }
  };

  return (
    <div className="beneficio-modal-overlay">
      <div className="beneficio-modal" role="dialog" aria-modal="true" aria-labelledby="beneficio-modal-titulo">
        <div className="beneficio-modal-header">
          <h2 id="beneficio-modal-titulo">{beneficio ? `Editar beneficio #${beneficio.id}` : 'Nuevo beneficio'}</h2>
          <button type="button" className="beneficio-icon-btn" onClick={onCerrar} aria-label="Cerrar" disabled={guardando}>
            <FaTimes />
          </button>
        </div>

        <form className="beneficio-form" onSubmit={guardar}>
          <div className="beneficio-form-columnas">
            <div className="beneficio-form-campos">
              <label className="beneficio-label">
                Título <span className="beneficio-ayuda">(obligatorio si no hay imagen)</span>
                <input className="beneficio-input" maxLength={LARGOS.titulo} value={datos.titulo} onChange={cambiarTexto('titulo')} />
              </label>

              <label className="beneficio-label">
                Descripción <span className="beneficio-ayuda">(opcional)</span>
                <textarea
                  className="beneficio-input beneficio-textarea"
                  rows={4}
                  maxLength={LARGOS.descripcion}
                  value={datos.descripcion}
                  onChange={(e) => {
                    const descripcion = e.target.value;
                    setDatos((prev) => ({ ...prev, descripcion }));
                  }}
                />
                <span className="beneficio-contador">
                  {datos.descripcion.length}/{LARGOS.descripcion}
                </span>
              </label>

              <label className="beneficio-label">
                Imagen <span className="beneficio-ayuda">(opcional, JPG, PNG o WEBP, hasta 1 MB; medida recomendada 1200 × 600 px)</span>
                <input className="beneficio-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirImagen} />
              </label>
              {imagenVista && (
                <button type="button" className="beneficio-btn beneficio-btn-secundario beneficio-btn-chico" onClick={quitarImagen}>
                  Quitar imagen
                </button>
              )}

              <label className="beneficio-label">
                Link de "Más info"{' '}
                <span className="beneficio-ayuda">
                  (opcional: andessalud.com.ar, andessalud.ar o un WhatsApp https://wa.me/54...)
                </span>
                <input
                  className="beneficio-input"
                  type="url"
                  placeholder="https://"
                  value={datos.linkUrl}
                  onChange={cambiarTexto('linkUrl')}
                />
              </label>
              {problemaLink && <p className="beneficio-aviso">{problemaLink} No se va a poder guardar así.</p>}
              {datos.linkUrl.trim() !== '' && !problemaLink && linkLoAbreLaAppBeneficio(datos.linkUrl) && (
                <p className="beneficio-ayuda">La tarjeta va a mostrar el botón "Más info".</p>
              )}

              <fieldset className="beneficio-fieldset">
                <legend>Ubicación</legend>
                <p className="beneficio-ayuda">
                  Con ubicación, la tarjeta muestra el botón "Cómo llegar". Pegá el link de Google Maps del lugar y tocá "Leer
                  ubicación", o cargá la latitud y la longitud a mano.
                </p>

                <label className="beneficio-label">
                  Link de Google Maps
                  <div className="beneficio-fila-boton">
                    <input
                      className="beneficio-input"
                      type="url"
                      placeholder="https://maps.app.goo.gl/..."
                      value={linkMaps}
                      onChange={(e) => setLinkMaps(e.target.value)}
                    />
                    <button
                      type="button"
                      className="beneficio-btn beneficio-btn-secundario"
                      onClick={() => void leerUbicacion()}
                      disabled={leyendo || guardando}
                    >
                      <FaMapMarkerAlt /> {leyendo ? 'Leyendo...' : 'Leer ubicación'}
                    </button>
                  </div>
                </label>
                {avisoUbicacion && (
                  <p className={avisoUbicacion.tipo === 'ok' ? 'beneficio-exito' : 'beneficio-aviso'}>{avisoUbicacion.texto}</p>
                )}

                <div className="beneficio-fila">
                  <label className="beneficio-label">
                    Latitud
                    <input
                      className="beneficio-input"
                      inputMode="decimal"
                      placeholder="-32.8895"
                      value={datos.lat}
                      onChange={cambiarTexto('lat')}
                    />
                  </label>
                  <label className="beneficio-label">
                    Longitud
                    <input
                      className="beneficio-input"
                      inputMode="decimal"
                      placeholder="-68.8458"
                      value={datos.lng}
                      onChange={cambiarTexto('lng')}
                    />
                  </label>
                </div>
                {problemaCoordenadas && <p className="beneficio-aviso">{problemaCoordenadas}</p>}

                <div className="beneficio-fila-acciones">
                  {coordenadas && (
                    <a
                      className="beneficio-enlace"
                      href={urlVerEnMaps(coordenadas.lat, coordenadas.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver en Maps
                    </a>
                  )}
                  {(datos.lat.trim() !== '' || datos.lng.trim() !== '') && (
                    <button
                      type="button"
                      className="beneficio-btn beneficio-btn-secundario beneficio-btn-chico"
                      onClick={quitarUbicacion}
                    >
                      Quitar ubicación
                    </button>
                  )}
                </div>

                <label className="beneficio-label">
                  Dirección <span className="beneficio-ayuda">(opcional, se muestra en la tarjeta)</span>
                  <input
                    className="beneficio-input"
                    maxLength={LARGOS.direccion}
                    placeholder="Av. San Martín 1234, Ciudad de Mendoza"
                    value={datos.direccion}
                    onChange={cambiarTexto('direccion')}
                  />
                </label>
              </fieldset>

              <label className="beneficio-label">
                Prioridad{' '}
                <span className="beneficio-ayuda">
                  ({PRIORIDAD_MIN} = sale primero; vacío = al final al crear, no cambia al editar)
                </span>
                <input
                  className="beneficio-input beneficio-input-corto"
                  type="number"
                  min={PRIORIDAD_MIN}
                  max={PRIORIDAD_MAX}
                  step={1}
                  value={datos.orden}
                  onChange={cambiarTexto('orden')}
                />
              </label>
              {problemaPrioridad && <p className="beneficio-aviso">{problemaPrioridad}</p>}

              <div className="beneficio-fila">
                <label className="beneficio-label">
                  Se muestra desde
                  <input className="beneficio-input" type="date" value={datos.vigenciaDesde} onChange={cambiarTexto('vigenciaDesde')} />
                </label>
                <label className="beneficio-label">
                  Hasta (inclusive)
                  <input className="beneficio-input" type="date" value={datos.vigenciaHasta} onChange={cambiarTexto('vigenciaHasta')} />
                </label>
              </div>
              {problemaFechas && <p className="beneficio-aviso">{problemaFechas}</p>}

              <fieldset className="beneficio-fieldset">
                <legend>¿A quién le sale?</legend>
                <p className="beneficio-ayuda">Con "Todos" marcado, no se filtra por eso.</p>

                <span className="beneficio-sublabel">Planes</span>
                <div className="beneficio-checks">
                  <label className="beneficio-check beneficio-check-todos">
                    <input
                      type="checkbox"
                      checked={datos.segmentacion.planes.length === 0}
                      onChange={() => marcarTodos('planes')}
                    />
                    Todos
                  </label>
                  {FAMILIAS_PLAN.map((plan) => (
                    <label key={plan.valor} className="beneficio-check">
                      <input
                        type="checkbox"
                        checked={datos.segmentacion.planes.includes(plan.valor)}
                        onChange={() => alternarOpcion('planes', plan.valor)}
                      />
                      {plan.etiqueta}
                    </label>
                  ))}
                </div>

                <span className="beneficio-sublabel">Provincias</span>
                <div className="beneficio-checks">
                  <label className="beneficio-check beneficio-check-todos">
                    <input
                      type="checkbox"
                      checked={datos.segmentacion.provincias.length === 0}
                      onChange={() => marcarTodos('provincias')}
                    />
                    Todas
                  </label>
                  {PROVINCIAS.map((provincia) => (
                    <label key={provincia.valor} className="beneficio-check">
                      <input
                        type="checkbox"
                        checked={datos.segmentacion.provincias.includes(provincia.valor)}
                        onChange={() => alternarOpcion('provincias', provincia.valor)}
                      />
                      {provincia.etiqueta}
                    </label>
                  ))}
                </div>

                <div className="beneficio-fila">
                  <label className="beneficio-label">
                    Edad mínima
                    <input
                      className="beneficio-input"
                      type="number"
                      min={0}
                      max={120}
                      value={datos.segmentacion.edadMin ?? ''}
                      onChange={cambiarEdad('edadMin')}
                    />
                  </label>
                  <label className="beneficio-label">
                    Edad máxima
                    <input
                      className="beneficio-input"
                      type="number"
                      min={0}
                      max={120}
                      value={datos.segmentacion.edadMax ?? ''}
                      onChange={cambiarEdad('edadMax')}
                    />
                  </label>
                </div>
                {problemaEdades && <p className="beneficio-aviso">{problemaEdades}</p>}
              </fieldset>

              <fieldset className="beneficio-fieldset">
                <legend>Solo para estos DNI (opcional)</legend>
                <p className="beneficio-ayuda">
                  Si cargás una lista, el beneficio le aparece solo a esos DNI (y que además cumplan plan, provincia y edad si los
                  elegiste).
                </p>

                {dnisGuardados > 0 && !listaNueva && (
                  <p className="beneficio-ayuda">
                    Tiene una lista de {dnisGuardados} {dnisGuardados === 1 ? 'DNI' : 'DNIs'}. Para reemplazarla, subí otra o pegá los
                    DNIs nuevos.
                  </p>
                )}

                <div className="beneficio-modo" role="group" aria-label="Cómo cargar la lista de DNIs">
                  {(
                    [
                      { valor: 'archivo', etiqueta: 'Subir un archivo' },
                      { valor: 'texto', etiqueta: 'Pegar DNIs' },
                    ] as const
                  ).map((opcion) => (
                    <button
                      type="button"
                      key={opcion.valor}
                      className={`beneficio-modo-opcion ${modoDnis === opcion.valor ? 'beneficio-modo-opcion-activa' : ''}`}
                      onClick={() => cambiarModoDnis(opcion.valor)}
                      aria-pressed={modoDnis === opcion.valor}
                    >
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
                {modoDnis === 'archivo' ? (
                  <label className="beneficio-label">
                    Archivo con los DNIs <span className="beneficio-ayuda">(Excel .xlsx, .csv o .txt, hasta 1 MB)</span>
                    <input className="beneficio-input" type="file" accept={ACEPTA_DNIS} onChange={elegirArchivoDnis} />
                  </label>
                ) : (
                  <label className="beneficio-label">
                    DNIs pegados <span className="beneficio-ayuda">(uno por línea; sirven con puntos o el CUIL)</span>
                    <textarea
                      className="beneficio-input beneficio-textarea"
                      rows={4}
                      placeholder={'30111222\n30.111.223\n20-30111224-5'}
                      value={datos.dnisTexto}
                      onChange={(e) => {
                        const dnisTexto = e.target.value;
                        setDatos((prev) => ({ ...prev, dnisTexto, quitarDnis: false }));
                      }}
                    />
                  </label>
                )}
                {datos.archivoDnis && (
                  <p className="beneficio-ayuda">
                    Archivo elegido: {datos.archivoDnis.name}. Los DNIs se leen al guardar
                    {dnisGuardados > 0 ? ` y reemplazan a los ${dnisGuardados} que tenía.` : '.'}
                  </p>
                )}
                {datos.dnisTexto.trim() !== '' && dnisGuardados > 0 && (
                  <p className="beneficio-ayuda">Al guardar, los DNIs pegados reemplazan a los {dnisGuardados} que tenía.</p>
                )}
                {datos.quitarDnis && (
                  <p className="beneficio-aviso">
                    Al guardar se borra la lista: el beneficio le va a salir a todos los que cumplan lo de arriba.
                  </p>
                )}
                {tieneListaDnis && (
                  <button type="button" className="beneficio-btn beneficio-btn-secundario beneficio-btn-chico" onClick={quitarListaDnis}>
                    Quitar la lista
                  </button>
                )}
                <p className="beneficio-ayuda">
                  El archivo puede ser una sola columna de DNIs, o una planilla con más columnas si la de los DNIs tiene el título
                  "DNI" (también sirve "Documento" o "CUIL"): se lee solo esa columna. Al guardar te avisa cuántos DNIs quedaron.
                </p>
              </fieldset>
            </div>

            <div className="beneficio-form-preview">
              <span className="beneficio-sublabel">Vista previa en la app</span>
              <BeneficioPreview
                titulo={datos.titulo}
                descripcion={datos.descripcion}
                imagenUrl={imagenVista}
                direccion={datos.direccion}
                masInfo={linkLoAbreLaAppBeneficio(datos.linkUrl)}
                comoLlegar={coordenadas !== null || datos.direccion.trim() !== ''}
              />
            </div>
          </div>

          {error && <p className="beneficio-error">{error}</p>}

          <div className="beneficio-modal-acciones">
            <button type="button" className="beneficio-btn beneficio-btn-secundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="beneficio-btn beneficio-btn-primario" disabled={guardando}>
              <FaSave /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BeneficioForm;
