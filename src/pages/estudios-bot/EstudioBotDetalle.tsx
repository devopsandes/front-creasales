// src/pages/estudios-bot/EstudioBotDetalle.tsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaSave, FaPlus, FaTrash, FaEye, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt, FaSync } from "react-icons/fa"
import LupaSelector from "./LupaSelector"
import { VEREDICTO_CFG, badgeBot, formatFecha } from "./EstudiosBot"
import {
    buscarDiagnosticos, buscarEfectores, buscarPrestaciones, buscarPrestadores, buscarSolicitantes,
    guardarComentarioFinal, guardarRevision, obtenerEstudio, obtenerImagenEstudio, obtenerMotivosRechazo, reanalizarEstudio,
} from "../../services/estudios-bot/estudiosBot.api"
import {
    CatMotivo, CatPrestacion, DecisionBot, EstudioDetalle, PrestacionElegida, Ref, RevisionOperadora, Veredicto,
} from "../../interfaces/estudios-bot.interface"
import './estudios-bot.css'

const vacio: Ref = { id: null, nombre: null }

/** Los pedidos escaneados llegan como PDF; una etiqueta <img> no los muestra. */
const esPdf = (url: string) => /\.pdf(\?|#|$)/i.test(url)

const OPINION_CFG: Record<string, { label: string; cls: string; sel: string }> = {
    BIEN: { label: 'El bot lo hubiera hecho bien', cls: 'eb-badge-verde', sel: 'eb-sel-codificar' },
    MAL: { label: 'El bot se equivocó', cls: 'eb-badge-rojo', sel: 'eb-sel-rechazar' },
    AMBAS_VALIDAS: { label: 'Ambas están bien', cls: 'eb-badge-amarillo', sel: 'eb-sel-derivar' },
}

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

    // Segundo paso: opinión después de ver lo del bot
    const [opinionBot, setOpinionBot] = useState<'BIEN' | 'MAL' | 'AMBAS_VALIDAS' | ''>('')
    const [comentarioFinal, setComentarioFinal] = useState('')
    const [guardandoFinal, setGuardandoFinal] = useState(false)

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

    // Reanálisis con el código actual (solo con la clave de supervisión).
    const [modoRe, setModoRe] = useState<'matching' | 'completo'>('matching')
    const [reanalizando, setReanalizando] = useState(false)
    const reanalizar = async () => {
        if (!id || !clave.trim()) { avisar('err', 'Ingresá la clave de supervisión'); return }
        setReanalizando(true)
        try {
            const r = await reanalizarEstudio(id, modoRe, clave.trim())
            if (!r.id) {
                const m = Array.isArray(r.message) ? r.message.join(', ') : r.message
                throw new Error(m ?? 'No se pudo reanalizar')
            }
            avisar('ok', 'Reanálisis listo')
            navigate(`/dashboard/estudios-bot/${r.id}`)
        } catch (e) {
            avisar('err', e instanceof Error ? e.message : 'Error al reanalizar')
        } finally {
            setReanalizando(false)
        }
    }

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
        if (comentario.trim().length < 15) return 'Explicá por qué elegiste lo que elegiste (mínimo 15 caracteres)'
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

    const guardarFinal = async () => {
        if (!id || !opinionBot) { avisar('err', 'Elegí una opción'); return }
        if (comentarioFinal.trim().length < 15) { avisar('err', 'Explicá por qué el bot lo hizo bien o mal (mínimo 15 caracteres)'); return }
        setGuardandoFinal(true)
        try {
            const r = await guardarComentarioFinal(id, { opinionBot, comentario: comentarioFinal.trim() || undefined })
            if (!r.id) {
                const m = Array.isArray(r.message) ? r.message.join(', ') : r.message
                throw new Error(m ?? 'No se pudo guardar')
            }
            setDetalle(r)
            avisar('ok', 'Comentario guardado')
        } catch (e) {
            avisar('err', e instanceof Error ? e.message : 'Error al guardar')
        } finally {
            setGuardandoFinal(false)
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
                            Prestador elegido en el bot: <b>{(detalle as any).prestadorElegido?.nombre ?? detalle.prestador.nombre ?? '—'}</b>
                            {(detalle as any).prestadorElegido && <> → el bot lo cambió a <b>{detalle.prestador.nombre}</b> ({String((detalle as any).prestadorElegido.tipo ?? '').toLowerCase()} tercerizado)</>}
                            {detalle.especialidad_bot && <> · Especialidad: <b>{detalle.especialidad_bot}</b></>}
                        </div>
                        <div className="eb-cab-sub">
                            Categoría: <b>{detalle.afiliadoCategoria ?? 'desconocida'}</b>
                            {detalle.botTope && <> · Tope por estudio: <b>{fmtPesos(detalle.botTope)}</b></>}
                        </div>
                        {detalle.reanalisis_de && (
                            <div className="eb-cab-sub">
                                <span className="eb-tag-prueba">REANÁLISIS</span> modo <b>{detalle.modo_reanalisis}</b> ·{' '}
                                <button className="eb-btn-link" onClick={() => navigate(`/dashboard/estudios-bot/${detalle.reanalisis_de}`)}>ver análisis original</button>
                            </div>
                        )}
                    </div>
                    {bot && (
                        <div className="eb-cab-veredicto">
                            <span className="eb-label">Bot</span>
                            <span className={`eb-badge eb-badge-lg ${badgeBot(bot.veredicto, bot.motivo?.texto).cls}`}>{badgeBot(bot.veredicto, bot.motivo?.texto).label}</span>
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
                        ? esPdf(imagenUrl)
                            ? <iframe src={imagenUrl} title="Pedido médico" style={{ width: '100%', height: '80vh', border: 0 }} />
                            : <div className="eb-imagen-scroll"><img src={imagenUrl} alt="Pedido médico" className="eb-imagen" /></div>
                        : <div className="eb-modal-info">No se pudo obtener la imagen</div>}
                </div>

                <div className="eb-col-derecha">
                    {/* Formulario de la operadora */}
                    <div className="eb-card">
                        <div className="eb-card-title">Datos de la orden (operadora)</div>

                        {op ? (
                            <RevisionGuardada op={op} total={detalle.opTotal} />
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
                                    <label className="eb-label">Por qué elegiste esto (obligatorio)</label>
                                    <textarea className="eb-input eb-textarea" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)}
                                        placeholder={veredicto === 'DERIVAR'
                                            ? 'Ej.: necesita auditoría médica, el prestador no realiza el estudio...'
                                            : veredicto === 'RECHAZAR'
                                                ? 'Ej.: la fecha del pedido es del 3/6, ya pasaron más de 30 días...'
                                                : 'Ej.: elegí OCT posterior porque el diagnóstico es glaucoma; el médico pidió "Eco TV" que en este prestador es ECOGRAFIA GINECOLOGICA TRANSVAGINAL...'} />
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
                        {!detalle.reanalisis_de && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center', marginBottom: '.75rem' }}>
                                <input
                                    type="password"
                                    className="eb-input"
                                    placeholder="Clave de supervisión"
                                    value={clave}
                                    onChange={(e) => setClave(e.target.value)}
                                    style={{ width: 180, flex: '0 0 auto' }}
                                />
                                <select
                                    className="eb-input"
                                    value={modoRe}
                                    onChange={(e) => setModoRe(e.target.value as any)}
                                    style={{ width: 230, flex: '0 0 auto' }}
                                >
                                    <option value="matching">Solo matching</option>
                                    <option value="completo">Completo (relee la imagen)</option>
                                </select>
                                <button
                                    className="eb-btn-secondary"
                                    onClick={reanalizar}
                                    disabled={reanalizando || !clave.trim()}
                                    style={{ flex: '1 1 auto', whiteSpace: 'nowrap' }}
                                >
                                    <FaSync /> {reanalizando ? 'Reanalizando...' : 'Reanalizar con el código actual'}
                                </button>
                            </div>
                        )}
                        {bot ? (
                            <>
                                <VistaBot bot={bot} op={op} total={detalle.botTotal} mostrarJson={mostrarJson} setMostrarJson={setMostrarJson} />

                                {op && (
                                    <div className="eb-final">
                                        <div className="eb-subtitle">Ahora que viste lo del bot, ¿qué opinás?</div>
                                        {op.comentarioFinalFecha ? (
                                            <div>
                                                <span className={`eb-badge ${OPINION_CFG[op.opinionBot ?? '']?.cls ?? ''}`}>{OPINION_CFG[op.opinionBot ?? '']?.label ?? op.opinionBot}</span>
                                                {op.comentarioFinal && <p className="eb-final-texto">{op.comentarioFinal}</p>}
                                                <span className="eb-hint">Guardado el {formatFecha(op.comentarioFinalFecha)}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="eb-veredictos">
                                                    {(['BIEN', 'MAL', 'AMBAS_VALIDAS'] as const).map((o) => (
                                                        <label key={o} className={`eb-veredicto-opt ${opinionBot === o ? OPINION_CFG[o].sel : ''}`}>
                                                            <input type="radio" name="opinion" checked={opinionBot === o} onChange={() => setOpinionBot(o)} />
                                                            {OPINION_CFG[o].label}
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="eb-field">
                                                    <label className="eb-label">Por qué el bot lo hizo bien o mal (obligatorio)</label>
                                                    <textarea className="eb-input eb-textarea" rows={3} value={comentarioFinal} onChange={(e) => setComentarioFinal(e.target.value)}
                                                        placeholder="Ej.: el bot eligió OCT posterior, yo la bilateral; las dos sirven para glaucoma..." />
                                                </div>
                                                <div className="eb-actions">
                                                    <button className="eb-btn-primary" onClick={guardarFinal} disabled={guardandoFinal || !opinionBot || comentarioFinal.trim().length < 15}>
                                                        <FaSave /> {guardandoFinal ? 'Guardando...' : 'Guardar opinión'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
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

const fmtPesos = (n: number | string | null | undefined) =>
    n === null || n === undefined || n === '' ? '—' : `$ ${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

const fmtRef = (r: Ref | undefined, conMat = false, conCod = false) => {
    if (!r?.nombre) return ''
    if (conMat) return `${r.nombre} (Mat.:${r.matricula ?? ''})`
    if (conCod) return `${r.nombre} (Cod.:${r.codigo ?? ''})`
    return r.nombre
}

/** Si el bot no encontró al solicitante, muestra lo que leyó del sello. */
const solicitanteBot = (bot: DecisionBot): string => {
    if (bot.solicitante?.id) return fmtRef(bot.solicitante, true)
    const l = (bot.lectura ?? {}) as Record<string, unknown>
    const nombre = l.profesional_nombre ? String(l.profesional_nombre) : null
    const mat = l.profesional_matricula ? String(l.profesional_matricula) : null
    if (!nombre && !mat) return 'No encontrado'
    return `No encontrado (leído: ${nombre ?? '—'}${mat ? `, Mat. ${mat}` : ''})`
}

const RevisionGuardada = ({ op, total }: { op: RevisionOperadora; total?: string | null }) => (
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
            <thead><tr><th>Descripción</th><th>Cant.</th><th>$ conv.</th></tr></thead>
            <tbody>
                {op.prestaciones.length === 0 && <tr><td colSpan={3} className="eb-empty-sm">—</td></tr>}
                {op.prestaciones.map((p, i) => (
                    <tr key={i}><td>{p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span></td><td>{p.cantidad}</td><td>{fmtPesos(p.importeConvenido)}</td></tr>
                ))}
                {op.prestaciones.length > 0 && (
                    <tr><td colSpan={2} style={{ textAlign: 'right' }}><b>Total convenido</b></td><td><b>{fmtPesos(total)}</b></td></tr>
                )}
            </tbody>
        </table>
    </div>
)

const VistaBot = ({ bot, op, total, mostrarJson, setMostrarJson }: {
    bot: DecisionBot; op: RevisionOperadora | null; total?: string | null; mostrarJson: boolean; setMostrarJson: (v: boolean) => void
}) => {
    const cmp = (a?: string | null, b?: string | null): boolean | null => (op ? (a ?? null) === (b ?? null) : null)
    const codigosOp = new Set((op?.prestaciones ?? []).map((p) => p.idCodigo))
    return (
        <div>
            <div className="eb-guardada-head">
                <span className={`eb-badge ${badgeBot(bot.veredicto, bot.motivo?.texto).cls}`}>{badgeBot(bot.veredicto, bot.motivo?.texto).label}</span>
                {op && <span className={`eb-cmp ${op.veredicto === bot.veredicto ? 'eb-cmp-ok' : 'eb-cmp-no'}`}>{op.veredicto === bot.veredicto ? 'coincide con la operadora' : 'difiere de la operadora'}</span>}
                <span className="eb-hint">confianza {bot.confianza ?? '—'} · {bot.modelo ?? ''} · {bot.duracionMs ?? '—'} ms</span>
            </div>
            {bot.motivo?.texto && bot.veredicto !== 'CODIFICAR' && <Campo label="Motivo" valor={bot.motivo.texto} igual={cmp(op?.motivo?.texto, bot.motivo.texto)} />}
            {bot.detalle && <Campo label="Detalle" valor={bot.detalle} />}
            <Campo label="Prestador" valor={fmtRef(bot.prestador)} igual={cmp(op?.prestador?.id, bot.prestador?.id)} />
            <Campo label="Profesional solicitante" valor={solicitanteBot(bot)} igual={cmp(op?.solicitante?.id, bot.solicitante?.id)} />
            <Campo label="Diagnóstico" valor={fmtRef(bot.diagnostico, false, true)} igual={cmp(op?.diagnostico?.id, bot.diagnostico?.id)} />
            {(() => {
                const dg = (bot.matchDetalle as any)?.diagnostico
                if (!dg) return null
                const partes: string[] = []
                if (dg.metodo) partes.push(`método ${dg.metodo}`)
                if (dg.bajado) partes.push(`bajado a ILEGIBLE: ${dg.bajado}`)
                if (dg.ia) {
                    if (dg.ia.error) partes.push(`IA: error ${dg.ia.error}`)
                    else if (dg.ia.elegido) partes.push(`IA eligió "${dg.ia.elegido.descripcion}" (conf. ${dg.ia.confianza}): ${dg.ia.motivo ?? ''}`)
                    else partes.push(`IA no eligió ninguno${dg.ia.motivo ? `: ${dg.ia.motivo}` : ''}`)
                }
                return <span className="eb-hint" style={{ display: 'block', margin: '-.25rem 0 .5rem' }}>{partes.join(' · ')}</span>
            })()}
            <Campo label="Profesional (efector)" valor={fmtRef(bot.efector)} igual={cmp(op?.efector?.id, bot.efector?.id)} />

            <div className="eb-campo-label" style={{ marginTop: '.5rem' }}>Prestaciones (lo que leyó → lo que eligió del catálogo)</div>
            <table className="eb-mini-table">
                <thead><tr><th>Leído en el pedido</th><th>Catálogo</th><th>Cant.</th><th>$ conv.</th><th>Método</th></tr></thead>
                <tbody>
                    {bot.prestaciones.length === 0 && <tr><td colSpan={5} className="eb-empty-sm">—</td></tr>}
                    {bot.prestaciones.map((p, i) => {
                        const igual = op ? (p.idCodigo ? codigosOp.has(p.idCodigo) : false) : null
                        return (
                            <tr key={i} className={igual === true ? 'eb-tr-igual' : igual === false ? 'eb-tr-distinto' : ''}>
                                <td>{p.texto}{p.codigoEscrito ? <span className="eb-cod"> [{p.codigoEscrito}]</span> : null}</td>
                                <td>{p.descripcion ? <>{p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span></> : <i>sin match</i>}</td>
                                <td>{p.cantidad}</td>
                                <td>{fmtPesos(p.importeConvenido)}</td>
                                <td>
                                    <span className="eb-cod">
                                        {p.alcanza === true ? '✅ ' : p.alcanza === false ? '❌ ' : ''}
                                        {p.metodo}
                                        {p.score !== undefined ? ` · ${p.score}` : ''}
                                        {p.cobertura !== undefined ? ` / cob. ${p.cobertura}` : ''}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                    {bot.prestaciones.length > 0 && (
                        <tr><td colSpan={3} style={{ textAlign: 'right' }}><b>Total convenido</b></td><td><b>{fmtPesos(total)}</b></td><td></td></tr>
                    )}
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
