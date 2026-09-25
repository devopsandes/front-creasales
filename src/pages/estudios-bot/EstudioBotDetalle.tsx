// src/pages/estudios-bot/EstudioBotDetalle.tsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaSave, FaPlus, FaTrash, FaEye, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt } from "react-icons/fa"
import LupaSelector from "./LupaSelector"
import { VEREDICTO_CFG, formatFecha } from "./EstudiosBot"
import {
  buscarDiagnosticos, buscarEfectores, buscarPrestaciones, buscarPrestadores, buscarSolicitantes,
  guardarRevision, obtenerEstudio, obtenerImagenEstudio, obtenerMotivosRechazo,
} from "../../services/estudios-bot/estudiosBot.api"
import {
  CatMotivo, CatPrestacion, DecisionBot, EstudioDetalle, PrestacionElegida, Ref, RevisionOperadora, Veredicto,
} from "../../interfaces/estudios-bot.interface"
import './estudios-bot.css'

const vacio: Ref = { id: null, nombre: null }

const EstudioBotDetalle = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [detalle, setDetalle] = useState<EstudioDetalle | null>(null)
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null)

  // Formulario de la operadora
  const [prestador, setPrestador] = useState<Ref>(vacio)
  const [solicitante, setSolicitante] = useState<Ref>(vacio)
  const [diagnostico, setDiagnostico] = useState<Ref>(vacio)
  const [efector, setEfector] = useState<Ref>(vacio)
  const [prestaciones, setPrestaciones] = useState<PrestacionElegida[]>([])
  const [prestacionTemp, setPrestacionTemp] = useState<CatPrestacion | null>(null)
  const [cantidadTemp, setCantidadTemp] = useState(1)
  const [veredicto, setVeredicto] = useState<Veredicto>('CODIFICAR')
  const [motivoId, setMotivoId] = useState('')
  const [comentario, setComentario] = useState('')
  const [motivos, setMotivos] = useState<CatMotivo[]>([])
  const [guardando, setGuardando] = useState(false)

  // Clave de supervisión
  const [clave, setClave] = useState('')
  const [vioBotAntes, setVioBotAntes] = useState(false)
  const [mostrarJson, setMostrarJson] = useState(false)

  const avisar = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const cargar = async (claveOpcional?: string) => {
    if (!id) return
    setCargando(true)
    setError(null)
    try {
      const d = await obtenerEstudio(id, claveOpcional)
      if (!d.id) throw new Error(d.message ?? 'No se pudo cargar el estudio')
      setDetalle(d)
      if (!d.operadora) {
        setPrestador(d.prestador ?? vacio)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    if (id) {
      obtenerImagenEstudio(id).then((r) => setImagenUrl(r.url ?? null)).catch(() => setImagenUrl(null))
      obtenerMotivosRechazo().then(setMotivos).catch(() => setMotivos([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const verBot = async () => {
    if (!clave.trim()) return
    await cargar(clave.trim())
    setVioBotAntes(true)
  }

  const agregarPrestacion = () => {
    if (!prestacionTemp) return
    setPrestaciones((prev) => [
      ...prev,
      { idCodigo: prestacionTemp.idCodigo, codigo: prestacionTemp.codigo, descripcion: prestacionTemp.descCodigo, cantidad: Math.max(1, cantidadTemp) },
    ])
    setPrestacionTemp(null)
    setCantidadTemp(1)
  }

  const motivoSel = useMemo(() => motivos.find((m) => m.idMensaje === motivoId) ?? null, [motivos, motivoId])

  const validar = (): string | null => {
    if (veredicto === 'RECHAZAR' && !motivoSel) return 'Elegí el motivo de rechazo'
    if (veredicto === 'DERIVAR' && !comentario.trim()) return 'Indicá por qué lo derivás'
    if (veredicto === 'CODIFICAR') {
      if (!solicitante.id) return 'Falta el profesional solicitante'
      if (!diagnostico.id) return 'Falta el diagnóstico'
      if (!prestaciones.length) return 'Agregá al menos una prestación'
    }
    return null
  }

  const guardar = async () => {
    if (!id) return
    const err = validar()
    if (err) { avisar('err', err); return }
    setGuardando(true)
    try {
      const r = await guardarRevision(id, {
        veredicto,
        motivo: motivoSel ? { id: motivoSel.idMensaje, texto: motivoSel.tema } : undefined,
        comentario: comentario.trim() || undefined,
        prestador: { id: prestador.id, nombre: prestador.nombre },
        solicitante: { id: solicitante.id, nombre: solicitante.nombre, matricula: solicitante.matricula },
        diagnostico: { id: diagnostico.id, nombre: diagnostico.nombre, codigo: diagnostico.codigo },
        efector: { id: efector.id, nombre: efector.nombre },
        prestaciones: prestaciones.map((p) => ({ idCodigo: p.idCodigo, codigo: p.codigo, descripcion: p.descripcion, cantidad: p.cantidad })),
        vioBotAntes,
      })
      if (!r.id) {
        const m = Array.isArray(r.message) ? r.message.join(', ') : r.message
        throw new Error(m ?? 'No se pudo guardar')
      }
      setDetalle(r)
      avisar('ok', 'Revisión guardada')
    } catch (e) {
      avisar('err', e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando && !detalle) return <div className="eb-wrapper"><div className="eb-loading">Cargando estudio...</div></div>
  if (error || !detalle) return (
    <div className="eb-wrapper">
      <div className="eb-container">
        <button className="eb-btn-link" onClick={() => navigate('/dashboard/estudios-bot')}><FaArrowLeft /> Volver</button>
        <div className="eb-error-banner"><FaTimesCircle /> <span>{error ?? 'No encontrado'}</span></div>
      </div>
    </div>
  )

  const op = detalle.operadora
  const bot = detalle.bot
  const idConvenioOp = prestador.id ?? detalle.prestador.id ?? ''
  const idAfiliado = detalle.id_afiliado ?? ''

  return (
    <div className="eb-wrapper">
      <div className="eb-header eb-header-detalle">
        <button className="eb-btn-link" onClick={() => navigate('/dashboard/estudios-bot')}><FaArrowLeft /> Volver al listado</button>
        <div className="eb-cabecera">
          <div>
            <div className="eb-cab-nombre">{detalle.afiliado_nombre ?? '—'} {detalle.es_prueba && <span className="eb-tag-prueba">PRUEBA</span>}</div>
            <div className="eb-cab-sub">
              N° {detalle.nro_afiliado ?? '—'} · DNI {detalle.dni ?? '—'} · {detalle.provincia ?? '—'} · {formatFecha(detalle.created_at)}
            </div>
            <div className="eb-cab-sub">
              Prestador elegido en el bot: <b>{detalle.prestador.nombre ?? '—'}</b>
              {detalle.especialidad_bot && <> · Especialidad: <b>{detalle.especialidad_bot}</b></>}
            </div>
          </div>
          {bot && (
            <div className="eb-cab-veredicto">
              <span className="eb-label">Bot</span>
              <span className={`eb-badge eb-badge-lg ${VEREDICTO_CFG[bot.veredicto]?.cls ?? ''}`}>{VEREDICTO_CFG[bot.veredicto]?.label ?? bot.veredicto}</span>
              {bot.motivo?.texto && bot.veredicto !== 'CODIFICAR' && <span className="eb-cab-motivo">{bot.motivo.texto}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="eb-container eb-detalle-grid">
        {/* Imagen */}
        <div className="eb-card eb-card-imagen">
          <div className="eb-card-title">
            Pedido médico
            {imagenUrl && <a className="eb-btn-link" href={imagenUrl} target="_blank" rel="noreferrer"><FaExternalLinkAlt /> Abrir</a>}
          </div>
          {imagenUrl
            ? <div className="eb-imagen-scroll"><img src={imagenUrl} alt="Pedido médico" className="eb-imagen" /></div>
            : <div className="eb-modal-info">No se pudo obtener la imagen</div>}
        </div>

        <div className="eb-col-derecha">
          {/* Formulario de la operadora */}
          <div className="eb-card">
            <div className="eb-card-title">Datos de la orden (operadora)</div>

            {op ? (
              <RevisionGuardada op={op} />
            ) : (
              <>
                <LupaSelector
                  label="Prestador"
                  valor={prestador.nombre ?? ''}
                  hint="Viene fijo desde el bot. Cambialo solo si vos hubieras elegido otro."
                  buscar={buscarPrestadores}
                  mapear={(p) => ({ id: p.idConvenio, titulo: p.nombreConvenio })}
                  onSeleccionar={(p) => { setPrestador({ id: p.idConvenio, nombre: p.nombreConvenio }); setEfector(vacio); setPrestaciones([]) }}
                />
                <LupaSelector
                  label="Profesional solicitante"
                  valor={solicitante.nombre ? `${solicitante.nombre} (Mat.:${solicitante.matricula ?? ''})` : ''}
                  buscar={buscarSolicitantes}
                  mapear={(p) => ({ id: p.idProfesional, titulo: p.nombre, subtitulo: `Mat. ${p.matricula}` })}
                  onSeleccionar={(p) => setSolicitante({ id: p.idProfesional, nombre: p.nombre, matricula: p.matricula })}
                  onLimpiar={() => setSolicitante(vacio)}
                />
                <LupaSelector
                  label="Diagnóstico"
                  valor={diagnostico.nombre ? `${diagnostico.nombre} (Cod.:${diagnostico.codigo ?? ''})` : ''}
                  buscar={buscarDiagnosticos}
                  mapear={(d) => ({ id: d.idDiagnostico, titulo: d.descDiagnostico, subtitulo: d.codigoDiagnostico })}
                  onSeleccionar={(d) => setDiagnostico({ id: d.idDiagnostico, nombre: d.descDiagnostico, codigo: d.codigoDiagnostico })}
                  onLimpiar={() => setDiagnostico(vacio)}
                />
                <LupaSelector
                  label="Profesional (efector)"
                  valor={efector.nombre ?? ''}
                  disabled={!idConvenioOp}
                  buscar={(q) => buscarEfectores(idConvenioOp, q)}
                  mapear={(e) => ({ id: e.idProfesional, titulo: e.nombreProfesional, subtitulo: e.matricula })}
                  onSeleccionar={(e) => setEfector({ id: e.idProfesional, nombre: e.nombreProfesional })}
                  onLimpiar={() => setEfector(vacio)}
                />

                <div className="eb-subtitle">Prestaciones</div>
                <div className="eb-prest-add">
                  <div className="eb-prest-add-lupa">
                    <LupaSelector
                      label="Prestación"
                      valor={prestacionTemp ? `(Cod: ${prestacionTemp.codigo}) ${prestacionTemp.descCodigo}` : ''}
                      disabled={!idConvenioOp || !idAfiliado}
                      buscar={(q) => buscarPrestaciones(idConvenioOp, idAfiliado, q)}
                      mapear={(p) => ({ id: p.idCodigo, titulo: p.descCodigo, subtitulo: `Cod. ${p.codigo}` })}
                      onSeleccionar={setPrestacionTemp}
                    />
                  </div>
                  <div className="eb-prest-add-cant">
                    <label className="eb-label">Cantidad</label>
                    <input type="number" min={1} className="eb-input" value={cantidadTemp} onChange={(e) => setCantidadTemp(Number(e.target.value) || 1)} />
                  </div>
                  <button type="button" className="eb-btn-plus" onClick={agregarPrestacion} disabled={!prestacionTemp} title="Agregar"><FaPlus /></button>
                </div>
                <table className="eb-mini-table">
                  <thead><tr><th>Descripción</th><th>Cant.</th><th></th></tr></thead>
                  <tbody>
                    {prestaciones.length === 0 && <tr><td colSpan={3} className="eb-empty-sm">Sin prestaciones cargadas</td></tr>}
                    {prestaciones.map((p, i) => (
                      <tr key={`${p.idCodigo}-${i}`}>
                        <td>{p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span></td>
                        <td>{p.cantidad}</td>
                        <td><button type="button" className="eb-btn-icon-del" onClick={() => setPrestaciones((prev) => prev.filter((_, j) => j !== i))}><FaTrash /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="eb-subtitle">¿Qué harías con este pedido?</div>
                <div className="eb-veredictos">
                  {(['CODIFICAR', 'RECHAZAR', 'DERIVAR'] as Veredicto[]).map((v) => (
                    <label key={v} className={`eb-veredicto-opt ${veredicto === v ? `eb-sel-${v.toLowerCase()}` : ''}`}>
                      <input type="radio" name="veredicto" checked={veredicto === v} onChange={() => setVeredicto(v)} />
                      {v === 'CODIFICAR' ? 'Codificar' : v === 'RECHAZAR' ? 'Rechazar' : 'Derivar / desasignar'}
                    </label>
                  ))}
                </div>

                {veredicto === 'RECHAZAR' && (
                  <div className="eb-field">
                    <label className="eb-label">Motivo de rechazo</label>
                    <select className="eb-input" value={motivoId} onChange={(e) => setMotivoId(e.target.value)}>
                      <option value="">Elegí un motivo...</option>
                      {motivos.map((m) => <option key={m.idMensaje} value={m.idMensaje}>{m.tema}</option>)}
                    </select>
                    {motivoSel?.texto && <span className="eb-hint">{motivoSel.texto}</span>}
                  </div>
                )}

                <div className="eb-field">
                  <label className="eb-label">{veredicto === 'DERIVAR' ? 'Por qué lo derivás' : 'Comentario (opcional)'}</label>
                  <textarea className="eb-input eb-textarea" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)}
                    placeholder={veredicto === 'DERIVAR' ? 'Ej.: necesita auditoría médica, el prestador no realiza el estudio...' : ''} />
                </div>

                <div className="eb-actions">
                  <button className="eb-btn-primary" onClick={guardar} disabled={guardando}>
                    <FaSave /> {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Lo del bot */}
          <div className="eb-card">
            <div className="eb-card-title">Lo que hubiera hecho el bot</div>
            {bot ? (
              <VistaBot bot={bot} op={op} mostrarJson={mostrarJson} setMostrarJson={setMostrarJson} />
            ) : (
              <div className="eb-bot-oculto">
                <p>Se muestra después de guardar tu revisión, para no influir en lo que completás.</p>
                <div className="eb-clave-row">
                  <input type="password" className="eb-input" placeholder="Clave de supervisión" value={clave}
                    onChange={(e) => setClave(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verBot()} />
                  <button className="eb-btn-secondary" onClick={verBot} disabled={!clave.trim()}><FaEye /> Ver</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`eb-toast ${toast.tipo === 'ok' ? 'eb-toast-ok' : 'eb-toast-err'}`}>
          {toast.tipo === 'ok' ? <FaCheckCircle /> : <FaTimesCircle />} <span>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

const Campo = ({ label, valor, igual }: { label: string; valor: string; igual?: boolean | null }) => (
  <div className={`eb-campo ${igual === true ? 'eb-campo-igual' : igual === false ? 'eb-campo-distinto' : ''}`}>
    <span className="eb-campo-label">{label}</span>
    <span className="eb-campo-valor">{valor || '—'}</span>
  </div>
)

const fmtRef = (r: Ref | undefined, conMat = false, conCod = false) => {
  if (!r?.nombre) return ''
  if (conMat) return `${r.nombre} (Mat.:${r.matricula ?? ''})`
  if (conCod) return `${r.nombre} (Cod.:${r.codigo ?? ''})`
  return r.nombre
}

const RevisionGuardada = ({ op }: { op: RevisionOperadora }) => (
  <div>
    <div className="eb-guardada-head">
      <span className={`eb-badge ${VEREDICTO_CFG[op.veredicto]?.cls ?? ''}`}>{VEREDICTO_CFG[op.veredicto]?.label ?? op.veredicto}</span>
      <span className="eb-hint">Guardado por {op.usuario.nombre ?? '—'} · {formatFecha(op.fecha)}{op.vioBotAntes ? ' · vio lo del bot antes' : ''}</span>
    </div>
    {op.motivo?.texto && <Campo label="Motivo" valor={op.motivo.texto} />}
    {op.comentario && <Campo label="Comentario" valor={op.comentario} />}
    <Campo label="Prestador" valor={fmtRef(op.prestador)} />
    <Campo label="Profesional solicitante" valor={fmtRef(op.solicitante, true)} />
    <Campo label="Diagnóstico" valor={fmtRef(op.diagnostico, false, true)} />
    <Campo label="Profesional (efector)" valor={fmtRef(op.efector)} />
    <div className="eb-campo-label" style={{ marginTop: '.5rem' }}>Prestaciones</div>
    <table className="eb-mini-table">
      <thead><tr><th>Descripción</th><th>Cant.</th></tr></thead>
      <tbody>
        {op.prestaciones.length === 0 && <tr><td colSpan={2} className="eb-empty-sm">—</td></tr>}
        {op.prestaciones.map((p, i) => (
          <tr key={i}><td>{p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span></td><td>{p.cantidad}</td></tr>
        ))}
      </tbody>
    </table>
  </div>
)

const VistaBot = ({ bot, op, mostrarJson, setMostrarJson }: {
  bot: DecisionBot; op: RevisionOperadora | null; mostrarJson: boolean; setMostrarJson: (v: boolean) => void
}) => {
  const cmp = (a?: string | null, b?: string | null): boolean | null => (op ? (a ?? null) === (b ?? null) : null)
  const codigosOp = new Set((op?.prestaciones ?? []).map((p) => p.idCodigo))
  return (
    <div>
      <div className="eb-guardada-head">
        <span className={`eb-badge ${VEREDICTO_CFG[bot.veredicto]?.cls ?? ''}`}>{VEREDICTO_CFG[bot.veredicto]?.label ?? bot.veredicto}</span>
        {op && <span className={`eb-cmp ${op.veredicto === bot.veredicto ? 'eb-cmp-ok' : 'eb-cmp-no'}`}>{op.veredicto === bot.veredicto ? 'coincide con la operadora' : 'difiere de la operadora'}</span>}
        <span className="eb-hint">confianza {bot.confianza ?? '—'} · {bot.modelo ?? ''} · {bot.duracionMs ?? '—'} ms</span>
      </div>
      {bot.motivo?.texto && bot.veredicto !== 'CODIFICAR' && <Campo label="Motivo" valor={bot.motivo.texto} igual={cmp(op?.motivo?.texto, bot.motivo.texto)} />}
      {bot.detalle && <Campo label="Detalle" valor={bot.detalle} />}
      <Campo label="Prestador" valor={fmtRef(bot.prestador)} igual={cmp(op?.prestador?.id, bot.prestador?.id)} />
      <Campo label="Profesional solicitante" valor={fmtRef(bot.solicitante, true)} igual={cmp(op?.solicitante?.id, bot.solicitante?.id)} />
      <Campo label="Diagnóstico" valor={fmtRef(bot.diagnostico, false, true)} igual={cmp(op?.diagnostico?.id, bot.diagnostico?.id)} />
      <Campo label="Profesional (efector)" valor={fmtRef(bot.efector)} igual={cmp(op?.efector?.id, bot.efector?.id)} />

      <div className="eb-campo-label" style={{ marginTop: '.5rem' }}>Prestaciones (lo que leyó → lo que eligió del catálogo)</div>
      <table className="eb-mini-table">
        <thead><tr><th>Leído en el pedido</th><th>Catálogo</th><th>Cant.</th><th>Método</th></tr></thead>
        <tbody>
          {bot.prestaciones.length === 0 && <tr><td colSpan={4} className="eb-empty-sm">—</td></tr>}
          {bot.prestaciones.map((p, i) => {
            const igual = op ? (p.idCodigo ? codigosOp.has(p.idCodigo) : false) : null
            return (
              <tr key={i} className={igual === true ? 'eb-tr-igual' : igual === false ? 'eb-tr-distinto' : ''}>
                <td>{p.texto}{p.codigoEscrito ? <span className="eb-cod"> [{p.codigoEscrito}]</span> : null}</td>
                <td>{p.descripcion ? <>{p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span></> : <i>sin match</i>}</td>
                <td>{p.cantidad}</td>
                <td><span className="eb-cod">{p.metodo} {p.score !== undefined ? `· ${p.score}` : ''}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <button className="eb-btn-link" onClick={() => setMostrarJson(!mostrarJson)} style={{ marginTop: '.75rem' }}>
        {mostrarJson ? 'Ocultar' : 'Ver'} lo que el bot interpretó de la imagen (JSON)
      </button>
      {mostrarJson && (
        <pre className="eb-json">{JSON.stringify({ lectura: bot.lectura, matching: bot.matchDetalle }, null, 2)}</pre>
      )}
    </div>
  )
}

export default EstudioBotDetalle
