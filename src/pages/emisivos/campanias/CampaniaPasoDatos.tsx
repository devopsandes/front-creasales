// CampaniaPasoDatos.tsx — paso 1 del asistente: nombre, a quién va y por qué canales.

import type { CanalCampania, DatosFormularioCampania, TipoDestinatario } from './campanias.api';
import { CANALES, LARGOS, TIPOS_DESTINATARIO } from './campaniasOpciones';

interface PasoDatosProps {
  datos: DatosFormularioCampania;
  onCambiar: (cambio: (prev: DatosFormularioCampania) => DatosFormularioCampania) => void;
  /** true si la campaña ya tiene lista cargada: el backend no deja cambiar canales ni destinatarios. */
  bloqueado: boolean;
  deshabilitado: boolean;
}

const AYUDA_CANAL: Record<CanalCampania, string> = {
  push: 'Notificación al celular (y al buzón de la app). Solo afiliados con la app.',
  mail: 'Mail con una plantilla de Andes. Sirve para afiliados y prestadores.',
  banner: 'Banner en el Home de la app, solo para los DNIs de la lista.',
};

const CampaniaPasoDatos = ({ datos, onCambiar, bloqueado, deshabilitado }: PasoDatosProps) => {
  const elegirTipo = (tipo: TipoDestinatario) => {
    onCambiar((prev) => ({
      ...prev,
      tipoDestinatario: tipo,
      // Los prestadores no tienen la app: queda solo el mail.
      canales: tipo === 'prestadores' ? { push: false, mail: true, banner: false } : prev.canales,
    }));
  };

  const alternarCanal = (canal: CanalCampania) => {
    onCambiar((prev) => ({ ...prev, canales: { ...prev.canales, [canal]: !prev.canales[canal] } }));
  };

  const soloMail = datos.tipoDestinatario === 'prestadores';

  return (
    <div className="campanias-paso">
      <label className="campanias-label">
        Nombre de la campaña <span className="campanias-ayuda">(es interno: lo ven ustedes, no los afiliados)</span>
        <input
          className="campanias-input"
          maxLength={LARGOS.nombre}
          placeholder="Beneficios octubre"
          value={datos.nombre}
          disabled={deshabilitado}
          onChange={(e) => {
            const valor = e.target.value;
            onCambiar((prev) => ({ ...prev, nombre: valor }));
          }}
        />
      </label>

      <div className="campanias-label">
        ¿A quién va?
        <div className="campanias-modo" role="group" aria-label="Tipo de destinatarios">
          {TIPOS_DESTINATARIO.map((tipo) => (
            <button
              type="button"
              key={tipo.valor}
              className={`campanias-modo-opcion ${datos.tipoDestinatario === tipo.valor ? 'campanias-modo-opcion-activa' : ''}`}
              onClick={() => elegirTipo(tipo.valor)}
              aria-pressed={datos.tipoDestinatario === tipo.valor}
              disabled={deshabilitado || bloqueado}
            >
              {tipo.etiqueta}
            </button>
          ))}
        </div>
        <span className="campanias-ayuda">{TIPOS_DESTINATARIO.find((tipo) => tipo.valor === datos.tipoDestinatario)?.ayuda}</span>
      </div>

      <fieldset className="campanias-fieldset" disabled={deshabilitado || bloqueado}>
        <legend>Canales</legend>
        <div className="campanias-canales">
          {CANALES.map((canal) => {
            const noDisponible = soloMail && canal.valor !== 'mail';
            return (
              <label key={canal.valor} className={`campanias-canal ${datos.canales[canal.valor] ? 'campanias-canal-activo' : ''}`}>
                <input
                  type="checkbox"
                  checked={datos.canales[canal.valor]}
                  disabled={noDisponible}
                  onChange={() => alternarCanal(canal.valor)}
                />
                <span>
                  <strong>{canal.etiqueta}</strong>
                  <span className="campanias-ayuda">{noDisponible ? 'No disponible para prestadores.' : AYUDA_CANAL[canal.valor]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {bloqueado && (
        <p className="campanias-aviso">
          Esta campaña ya tiene la lista cargada, así que no se pueden cambiar los destinatarios ni los canales. Si necesitás otros,
          creá una campaña nueva.
        </p>
      )}
    </div>
  );
};

export default CampaniaPasoDatos;
