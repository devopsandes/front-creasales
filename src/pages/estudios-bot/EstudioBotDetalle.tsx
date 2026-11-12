// src/pages/estudios-bot/EstudioBotDetalle.tsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { FaArrowLeft, FaSave, FaPlus, FaTrash, FaEye, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt, FaSync, FaCopy } from "react-icons/fa"
import LupaSelector from "./LupaSelector"
import TrabajoPendiente from "./TrabajoPendiente"
import ResumenGrupo from "./ResumenGrupo"
import { ACCION_CFG, VEREDICTO_CFG, TagOrigen, badgeBot, esTodoLaboratorio, formatFecha } from "./EstudiosBot"
import {
    buscarDiagnosticos, buscarEfectores, buscarPrestaciones, buscarPrestadores, buscarSolicitantes,
    guardarComentarioFinal, guardarRevision, obtenerEstudio, obtenerImagenEstudio, obtenerMotivosRechazo, procesarImagenEstudio, reanalizarEstudio,
} from "../../services/estudios-bot/estudiosBot.api"
import {
    CatMotivo, CatPrestacion, DecisionBot, EstudioDetalle, MultiFoto, PrestacionElegida, Ref, RevisionOperadora, RolFoto, Veredicto,
} from "../../interfaces/estudios-bot.interface"
import './estudios-bot.css'

const vacio: Ref = { id: null, nombre: null }

/** Los pedidos escaneados llegan como PDF; una etiqueta <img> no los muestra. */
const esPdf = (url: string) => /\.pdf(\?|#|$)/i.test(url)

/** Cómo se le cuenta a la operadora el rol que el bot le dio a cada foto. */
const ROL_FOTO_CFG: Record<RolFoto, { label: string; corto: string; cls: string }> = {
    PEDIDO: { label: 'Pedido médico', corto: '', cls: 'eb-foto-pedido' },
    CERTIFICADO: { label: 'Certificado de embarazo', corto: 'CERT.', cls: 'eb-foto-pedido' },
    CONTINUACION: { label: 'Continuación (dorso o segunda página) de otra foto', corto: '↳', cls: 'eb-foto-continuacion' },
    DUPLICADA: { label: 'La misma hoja repetida', corto: '=', cls: 'eb-foto-descartada' },
    NO_PEDIDO: { label: 'No es un pedido médico', corto: '✕', cls: 'eb-foto-descartada' },
}

/** Lo poco de la lectura de una foto descartada que se le muestra a la operadora. */
interface LecturaFoto {
    tipo_documento?: string
    legible?: boolean
    confianza_lectura?: number
    prestaciones_texto?: string[]
    diagnostico_texto?: string | null
    observaciones?: string | null
}

const OPINION_CFG: Record<string, { label: string; cls: string; sel: string }> = {
    BIEN: { label: 'El bot lo hubiera hecho bien', cls: 'eb-badge-verde', sel: 'eb-sel-codificar' },
    MAL: { label: 'El bot se equivocó', cls: 'eb-badge-rojo', sel: 'eb-sel-rechazar' },
    AMBAS_VALIDAS: { label: 'Ambas están bien', cls: 'eb-badge-amarillo', sel: 'eb-sel-derivar' },
}

const EstudioBotDetalle = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    /** `?foto=n`: con qué foto abrir (al saltar de un pedido a otro por las pestañas). */
    const [searchParams] = useSearchParams()

    const [detalle, setDetalle] = useState<EstudioDetalle | null>(null)
    const [imagenUrl, setImagenUrl] = useState<string | null>(null)
    /** Pedidos de la app con varias fotos: cuál se está mostrando (desde 1). */
    const [imagenN, setImagenN] = useState(1)
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
            // trabajar=true: si está pendiente, lo vuelve a tomar en Expendio.
            const d = await obtenerEstudio(id, claveOpcional, true)
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
        if (!id) return
        setImagenUrl(null)
        obtenerImagenEstudio(id, imagenN).then((r) => setImagenUrl(r.url ?? null)).catch(() => setImagenUrl(null))
    }, [id, imagenN])

    // Varias fotos: al abrir un pedido se muestra su propia foto (la que pide la
    // URL, o la primera de las suyas), no siempre la foto 1 de la solicitud.
    useEffect(() => {
        if (!detalle) return
        const pedida = Number(searchParams.get('foto'))
        const propia = detalle.multi?.imagenes?.[0]
        setImagenN(pedida > 0 ? pedida : propia ?? 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detalle?.id])

    /** Pestaña de foto: si la foto pertenece a otro pedido de la solicitud, se abre ese pedido. */
    const elegirFoto = (n: number) => {
        const f = detalle?.multi?.fotos.find((x) => x.n === n)
        if (f?.analisisId && f.analisisId !== detalle?.id) {
            navigate(`/dashboard/estudios-bot/${f.analisisId}?foto=${n}`)
            return
        }
        setImagenN(n)
    }

    // Etapa 2: resumen antes de confirmar la solicitud completa.
    const [resumenAbierto, setResumenAbierto] = useState(false)
    const alConfirmarGrupo = (d: EstudioDetalle) => {
        setResumenAbierto(false)
        if (d.id === id) setDetalle(d)
        else navigate(`/dashboard/estudios-bot/${d.id}`)
    }

    // "¿Desea procesarla?": la operadora pide analizar una foto que el bot descartó.
    const [fotoAProcesar, setFotoAProcesar] = useState<MultiFoto | null>(null)
    const [procesando, setProcesando] = useState(false)
    const procesarFoto = async () => {
        if (!id || !fotoAProcesar) return
        setProcesando(true)
        try {
            const r = await procesarImagenEstudio(id, fotoAProcesar.n)
            if (!r.id) {
                const m = Array.isArray(r.message) ? r.message.join(', ') : r.message
                throw new Error(m ?? 'No se pudo procesar la foto')
            }
            avisar('ok', `Foto ${fotoAProcesar.n} analizada como pedido ${r.multi?.pedido ?? ''}`)
            setFotoAProcesar(null)
            navigate(`/dashboard/estudios-bot/${r.id}?foto=${fotoAProcesar.n}`)
        } catch (e) {
            avisar('err', e instanceof Error ? e.message : 'Error al procesar la foto')
        } finally {
            setProcesando(false)
        }
    }

    useEffect(() => {
        cargar()
        if (id) {
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
    /** Varias fotos: la foto que se está mirando, si la solicitud tiene mapa de fotos. */
    const fotoActual = detalle?.multi?.fotos.find((f) => f.n === imagenN) ?? null
    const lecturaFoto = (fotoActual?.lectura ?? null) as LecturaFoto | null
    /** Solicitud con más de un pedido: las decisiones se guardan por pedido y se confirman juntas. */
    const esGrupo = Boolean(detalle?.multi && (detalle.multi.pedidos ?? 1) > 1)

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
    const exp = detalle.afiliadoExpendio ?? null
    const colorAfiliado = exp?.colorFondo && exp.colorFondo.toUpperCase() !== '#FFFFFF' ? exp.colorFondo : null
    // Para la cabecera: lo que cargó la operadora si ya resolvió; si no, la propuesta del bot.
    const prestacionesCab = op?.prestaciones?.length ? op.prestaciones : (bot?.prestaciones ?? [])
    const sinTope = esTodoLaboratorio(prestacionesCab)

    return (
        <div className="eb-wrapper">
            <div className="eb-header eb-header-detalle">
                <button className="eb-btn-link" onClick={() => navigate('/dashboard/estudios-bot')}><FaArrowLeft /> Volver al listado</button>
                <div className="eb-cabecera">
                    <div>
                        <div className="eb-cab-nombre" style={colorAfiliado ? { background: colorAfiliado, padding: '2px 10px', borderRadius: 6, display: 'inline-block' } : undefined}>
                            {detalle.afiliado_nombre ?? '—'}{' '}
                            {detalle.es_prueba && <span className="eb-tag-prueba">PRUEBA</span>}
                            {bot?.modoSombra === false && <span className="eb-tag-prueba" style={{ background: '#1b7f4b', color: '#fff' }}>REAL</span>}
                            <TagOrigen origen={detalle.origen} />
                        </div>
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
                            {sinTope
                                ? <> · Tope por estudio: <b>no aplica (laboratorio)</b></>
                                : detalle.botTope && <> · Tope por estudio: <b>{fmtPesos(detalle.botTope)}</b></>}
                        </div>

                        {exp && (
                            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: colorAfiliado ? `${colorAfiliado}55` : '#fafafa', borderLeft: colorAfiliado ? `6px solid ${colorAfiliado}` : undefined }}>
                                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', marginBottom: 6 }}>
                                    Afiliado en Expendio{colorAfiliado && <> · color <b style={{ color: '#111' }}>{colorAfiliado}</b></>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 24, rowGap: 2, fontSize: 13 }}>
                                    {[
                                        ['Apellido y nombre', exp.afiliado], ['Nº Afiliado', exp.numAfiliado],
                                        ['Fec. Nac.', exp.fecNac], ['Est. civil', exp.estadoCivil],
                                        ['Vig. Opción', exp.vigOpcion], ['Est. afiliación', exp.estadoAfiliacion],
                                        ['Parentesco', exp.parentesco], ['Edad', exp.edad],
                                        ['Nacionalidad', exp.nacionalidad], ['Per. Baja', exp.periodoBaja],
                                        ['Plan prestacional', exp.planPrestacional], ['Obra social', exp.obraSocial],
                                        ['Prestador', exp.prestador], ['Leído', formatFecha(exp.leidoEn)],
                                    ].map(([k, v]) => (
                                        <div key={k}><span style={{ color: '#6b7280' }}>{k}:</span> <b>{v || '—'}</b></div>
                                    ))}
                                </div>
                                {exp.viasClinicas?.length > 0 && (
                                    <div style={{ marginTop: 8, fontSize: 13 }}>
                                        <span style={{ color: '#6b7280' }}>Vías clínicas:</span>
                                        <ul style={{ margin: '2px 0 0 18px', padding: 0 }}>
                                            {exp.viasClinicas.map((v, i) => <li key={i}>{v}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {detalle.reanalisis_de && (
                            <div className="eb-cab-sub">
                                <span className="eb-tag-prueba">REANÁLISIS</span> modo <b>{detalle.modo_reanalisis}</b> ·{' '}
                                <button className="eb-btn-link" onClick={() => navigate(`/dashboard/estudios-bot/${detalle.reanalisis_de}`)}>ver análisis original</button>
                            </div>
                        )}
                    </div>
                    {bot && (
                        <div className="eb-cab-veredicto">
                            {detalle.multi && (detalle.multi.pedidos ?? 1) > 1 && (
                                <span className="eb-badge eb-badge-azul" title={`La solicitud tiene ${detalle.multi.total} fotos y el bot armó ${detalle.multi.pedidos} pedidos`}>
                                    PEDIDO {detalle.multi.pedido} DE {detalle.multi.pedidos}
                                </span>
                            )}
                            {detalle.estado === 'PENDIENTE' && <span className="eb-badge eb-badge-violeta">PENDIENTE DE RESOLVER</span>}
                            {detalle.resueltoPor === 'OPERADORA' && op && (
                                <span className={`eb-badge eb-badge-lg ${ACCION_CFG[detalle.accion ?? '']?.cls ?? ''}`}>{ACCION_CFG[detalle.accion ?? '']?.label ?? detalle.accion} por {op.usuario.nombre ?? '—'}</span>
                            )}
                            {detalle.resueltoPor === 'EXPENDIO' && <span className="eb-badge eb-badge-amarillo">{detalle.expendio?.estado === 'CODIFICADA' ? 'CODIFICADO' : detalle.expendio?.estado === 'RECHAZADA' ? 'RECHAZADO' : 'RESUELTO'} EN EXPENDIO</span>}
                            <span className="eb-label">{detalle.resueltoPor === 'BOT' ? 'Bot' : 'Propuesta del bot'}</span>
                            <span className={`eb-badge eb-badge-lg ${badgeBot(bot.veredicto, bot.motivo?.texto, bot.modoSombra === false, bot.accion).cls}`}>{badgeBot(bot.veredicto, bot.motivo?.texto, bot.modoSombra === false, bot.accion).label}</span>
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
                        {(detalle.imagenes?.length ?? 1) > 1 && (
                            <span className="eb-imagen-tabs" title="El pedido tiene varias fotos">
                                {detalle.imagenes!.map((_, i) => {
                                    const n = i + 1
                                    const f = detalle.multi?.fotos.find((x) => x.n === n)
                                    const cfg = f ? ROL_FOTO_CFG[f.rol] : null
                                    const mia = !f || f.analisisId === detalle.id
                                    const titulo = f
                                        ? `${cfg?.label ?? f.rol}${f.pedido ? ` · pedido ${f.pedido}` : ''}${f.de ? ` · de la foto ${f.de}` : ''}${f.motivo ? ` · ${f.motivo}` : ''}`
                                        : undefined
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`eb-imagen-tab ${imagenN === n ? 'eb-imagen-tab-activa' : ''} ${cfg?.cls ?? ''} ${mia ? '' : 'eb-imagen-tab-otro'}`}
                                            title={titulo}
                                            onClick={() => elegirFoto(n)}
                                        >
                                            Foto {n}{cfg?.corto ? ` ${cfg.corto}` : ''}{f?.pedido && (detalle.multi?.pedidos ?? 1) > 1 ? <small> P{f.pedido}</small> : null}
                                        </button>
                                    )
                                })}
                            </span>
                        )}
                        {imagenUrl && <a className="eb-btn-link" href={imagenUrl} target="_blank" rel="noreferrer"><FaExternalLinkAlt /> Abrir</a>}
                    </div>
                    {imagenUrl
                        ? esPdf(imagenUrl)
                            ? <iframe src={imagenUrl} title="Pedido médico" style={{ width: '100%', height: '80vh', border: 0 }} />
                            : <div className="eb-imagen-scroll"><img src={imagenUrl} alt="Pedido médico" className="eb-imagen" /></div>
                        : <div className="eb-modal-info">No se pudo obtener la imagen</div>}
                </div>

                <div className="eb-col-derecha">
                    {esGrupo && (
                        <div className="eb-card eb-grupo-barra">
                            <div className="eb-card-title">
                                Solicitud con {detalle.multi!.pedidos} pedidos
                                <span className="eb-hint" style={{ margin: '0 0 0 .5rem', display: 'inline' }}>{detalle.multi!.total} fotos · {detalle.multi!.fotos.filter((f) => !f.analisisId).length} descartadas</span>
                            </div>
                            <div className="eb-grupo-items">
                                {detalle.multi!.decisiones.map((d) => {
                                    const actual = d.analisisId === detalle.id
                                    const dec = d.decision
                                    const estado = d.estado !== 'PENDIENTE'
                                        ? { txt: d.accion === 'CODIFICADA' ? 'Codificada' : d.accion === 'RECHAZADA' ? 'Rechazada' : d.accion === 'DERIVADA' ? 'Derivada' : 'Resuelta', cls: 'eb-badge-gris' }
                                        : dec?.accion === 'CODIFICAR' ? { txt: 'Codificar ✓', cls: 'eb-badge-verde' }
                                            : dec?.accion === 'RECHAZAR' ? { txt: `Rechazar ✓`, cls: 'eb-badge-rojo' }
                                                : { txt: 'Sin decisión', cls: 'eb-badge-amarillo' }
                                    return (
                                        <button
                                            key={d.analisisId}
                                            type="button"
                                            className={`eb-grupo-item ${actual ? 'eb-grupo-item-actual' : ''}`}
                                            onClick={() => !actual && navigate(`/dashboard/estudios-bot/${d.analisisId}?foto=${d.imagenes[0] ?? 1}`)}
                                            title={dec?.motivoTexto ?? d.botMotivo ?? ''}
                                        >
                                            <span>Pedido {d.pedido} <small>· foto {d.imagenes.join(', ')}</small></span>
                                            <span className={`eb-badge ${estado.cls}`}>{estado.txt}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            {detalle.multi!.decisiones.some((d) => d.estado === 'PENDIENTE') && (
                                <div className="eb-actions" style={{ marginTop: '.5rem' }}>
                                    <span className="eb-hint" style={{ marginRight: 'auto' }}>
                                        {detalle.multi!.confirmable ? 'Todos los pedidos tienen decisión. Revisá el resumen y confirmá.' : 'Falta guardar la decisión de algún pedido.'}
                                    </span>
                                    <button type="button" className="eb-btn-primary" disabled={!detalle.multi!.confirmable} onClick={() => setResumenAbierto(true)}>
                                        <FaCheckCircle /> Confirmar solicitud completa
                                    </button>
                                </div>
                            )}
                            {detalle.multi!.decisiones.some((d) => d.error) && (
                                <div className="eb-error-banner" style={{ marginTop: '.5rem' }}>
                                    <FaTimesCircle /> <span>Último intento: {detalle.multi!.decisiones.find((d) => d.error)?.error}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Formulario de la operadora */}
                    <div className="eb-card">
                        <div className="eb-card-title">
                            {detalle.estado === 'PENDIENTE' ? 'Resolver este pedido' : detalle.resueltoPor === 'OPERADORA' ? `Resuelto por ${op?.usuario.nombre ?? 'operadora'}` : 'Datos de la orden (operadora)'}
                        </div>

                        {fotoActual && !fotoActual.analisisId ? (
                            <div className="eb-foto-aviso">
                                <div className="eb-error-banner" style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155', margin: 0 }}>
                                    <span>
                                        <b>El bot no procesó la foto {fotoActual.n}</b>: {fotoActual.motivo ?? ROL_FOTO_CFG[fotoActual.rol]?.label.toLowerCase() ?? fotoActual.rol}
                                        {fotoActual.de ? ` (de la foto ${fotoActual.de})` : ''}
                                        {fotoActual.error ? ` · Error de lectura: ${fotoActual.error}` : ''}
                                    </span>
                                </div>
                                {lecturaFoto && (
                                    <div className="eb-foto-lectura">
                                        <span className="eb-label">Lo que leyó el bot en esta foto</span>
                                        <div><span className="eb-hint">Tipo:</span> {lecturaFoto.tipo_documento ?? '—'} · <span className="eb-hint">legible:</span> {lecturaFoto.legible ? 'sí' : 'no'} · <span className="eb-hint">confianza:</span> {lecturaFoto.confianza_lectura ?? '—'}</div>
                                        {(lecturaFoto.prestaciones_texto?.length ?? 0) > 0 && (
                                            <div><span className="eb-hint">Prestaciones:</span> {lecturaFoto.prestaciones_texto!.join(' · ')}</div>
                                        )}
                                        {lecturaFoto.diagnostico_texto && <div><span className="eb-hint">Diagnóstico:</span> {lecturaFoto.diagnostico_texto}</div>}
                                        {lecturaFoto.observaciones && <div><span className="eb-hint">Observaciones:</span> {lecturaFoto.observaciones}</div>}
                                    </div>
                                )}
                                {fotoActual.avisoAfiliado && (
                                    <span className="eb-hint" style={{ margin: 0 }}>
                                        Al resolver la solicitud se le avisa al afiliado: «{fotoActual.avisoAfiliado}»
                                    </span>
                                )}
                                {detalle.estado === 'PENDIENTE' ? (
                                    <button type="button" className="eb-btn-primary" onClick={() => setFotoAProcesar(fotoActual)}>
                                        Procesar esta foto como un pedido
                                    </button>
                                ) : (
                                    <span className="eb-hint">La solicitud ya no está pendiente: esta foto no se puede procesar.</span>
                                )}
                            </div>
                        ) : detalle.estado === 'PENDIENTE' && bot ? (
                            <>
                                {esGrupo && (
                                    <div className="eb-error-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e3a8a', marginTop: 0 }}>
                                        <span>Esta solicitud tiene <b>{detalle.multi!.pedidos} pedidos médicos</b>. Guardá la decisión de cada uno (pestañas de fotos) y después <b>Confirmar solicitud completa</b>: todo sale junto hacia Andes. "Derivar" deriva la solicitud entera.</span>
                                    </div>
                                )}
                                <TrabajoPendiente key={detalle.id} detalle={detalle} motivos={motivos} avisar={avisar} onResuelto={(d) => setDetalle(d)} modoGrupo={esGrupo} />
                            </>
                        ) : detalle.resueltoPor === 'EXPENDIO' ? (
                            <div>
                                <div className="eb-error-banner" style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e', margin: 0 }}>
                                    <span>Este pedido se resolvió desde Expendio{detalle.expendio?.mensaje ? `: ${detalle.expendio.mensaje}` : ''}. No hay nada que hacer acá.</span>
                                </div>
                                <span className="eb-hint" style={{ marginTop: '.75rem' }}>Abajo queda lo que había propuesto el bot, para comparar.</span>
                            </div>
                        ) : op ? (
                            <>
                                <RevisionGuardada op={op} total={detalle.opTotal} accion={detalle.resueltoPor === 'OPERADORA' ? detalle.accion : null}
                                    textoAfiliado={detalle.resueltoPor === 'OPERADORA' ? (bot?.ejecucion as any)?.rechazo?.comentario ?? null : null} />
                                {detalle.resueltoPor === 'OPERADORA' && (
                                    <span className="eb-hint" style={{ marginTop: '.5rem' }}>
                                        {(detalle.camposModificados ?? []).length
                                            ? <span style={{ color: '#991b1b', fontWeight: 600 }}>Corrigió al bot en: {detalle.camposModificados!.join(', ')}</span>
                                            : 'Confirmó la propuesta del bot sin cambios'}
                                    </span>
                                )}
                            </>
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
                                        <input type="number" min={1} className="eb-input" value={cantidadTemp || ''} onChange={(e) => setCantidadTemp(Math.max(0, Math.floor(Number(e.target.value)) || 0))} />
                                    </div>
                                    <button type="button" className="eb-btn-plus" onClick={agregarPrestacion} disabled={!prestacionTemp} title="Agregar"><FaPlus /></button>
                                </div>
                                <table className="eb-mini-table">
                                    <thead><tr><th>Descripción</th><th>Cant.</th><th></th></tr></thead>
                                    <tbody>
                                        {prestaciones.length === 0 && <tr><td colSpan={3} className="eb-empty-sm">Sin prestaciones cargadas</td></tr>}
                                        {prestaciones.map((p, i) => (
                                            <tr key={`${p.idCodigo}-${i}`}>
                                                <td><span style={{ color: '#6b7280', fontWeight: 600 }}>{i + 1} -</span> {p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span></td>
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
                        <div className="eb-card-title">{detalle.estado === 'PENDIENTE' ? 'Propuesta del bot (detalle)' : detalle.resueltoPor === 'OPERADORA' ? 'Lo que había propuesto el bot' : bot?.modoSombra === false ? 'Lo que hizo el bot' : 'Lo que hubiera hecho el bot'}</div>
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

                                {op && detalle.resueltoPor !== 'OPERADORA' && (
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

            {resumenAbierto && detalle.multi && (
                <ResumenGrupo detalle={detalle} onClose={() => setResumenAbierto(false)} onConfirmado={alConfirmarGrupo} avisar={avisar} />
            )}

            {fotoAProcesar && (
                <div className="eb-modal-overlay" onClick={() => !procesando && setFotoAProcesar(null)}>
                    <div className="eb-modal eb-modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="eb-modal-header">
                            <span className="eb-modal-title">Procesar la foto {fotoAProcesar.n}</span>
                        </div>
                        <div className="eb-modal-texto">
                            <p>
                                El bot no la procesó: <b>{fotoAProcesar.motivo ?? ROL_FOTO_CFG[fotoAProcesar.rol]?.label.toLowerCase() ?? fotoAProcesar.rol}</b>
                                {fotoAProcesar.de ? ` (de la foto ${fotoAProcesar.de})` : ''}.
                            </p>
                            <p>
                                Si la procesás, el bot la vuelve a leer y la analiza como <b>un pedido médico más</b> de esta solicitud
                                {fotoAProcesar.rol === 'CONTINUACION' ? ', aunque ya la haya usado como parte de otro pedido: revisá que no se repitan prestaciones' : ''}. ¿Desea procesarla?
                            </p>
                            <div className="eb-modal-acciones">
                                <button type="button" className="eb-btn-secondary" disabled={procesando} onClick={() => setFotoAProcesar(null)}>No</button>
                                <button type="button" className="eb-btn-primary" disabled={procesando} onClick={procesarFoto}>
                                    {procesando ? <><FaSync className="spinning" /> Analizando...</> : 'Sí, procesarla'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

const RevisionGuardada = ({ op, total, accion, textoAfiliado }: { op: RevisionOperadora; total?: string | null; accion?: string | null; textoAfiliado?: string | null }) => (
    <div>
        <div className="eb-guardada-head">
            {accion && ACCION_CFG[accion]
                ? <span className={`eb-badge ${ACCION_CFG[accion].cls}`}>{ACCION_CFG[accion].label}</span>
                : <span className={`eb-badge ${VEREDICTO_CFG[op.veredicto]?.cls ?? ''}`}>{VEREDICTO_CFG[op.veredicto]?.label ?? op.veredicto}</span>}
            <span className="eb-hint">Guardado por {op.usuario.nombre ?? '—'} · {formatFecha(op.fecha)}{op.vioBotAntes ? ' · vio lo del bot antes' : ''}</span>
        </div>
        {op.motivo?.texto && <Campo label="Motivo" valor={op.motivo.texto} />}
        {textoAfiliado && <Campo label="Le llegó al afiliado" valor={textoAfiliado} />}
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
                    <tr key={i}><td><span style={{ color: '#6b7280', fontWeight: 600 }}>{i + 1} -</span> {p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span></td><td>{p.cantidad}</td><td>{fmtPesos(p.importeConvenido)}</td></tr>
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
                <span className={`eb-badge ${badgeBot(bot.veredicto, bot.motivo?.texto, bot.modoSombra === false, bot.accion).cls}`}>{badgeBot(bot.veredicto, bot.motivo?.texto, bot.modoSombra === false, bot.accion).label}</span>
                {bot.modoSombra === false && bot.ejecucion?.dryRun && <span className="eb-tag-prueba">SIMULADO (dryRun)</span>}
                {op && <span className={`eb-cmp ${op.veredicto === bot.veredicto ? 'eb-cmp-ok' : 'eb-cmp-no'}`}>{op.veredicto === bot.veredicto ? 'coincide con la operadora' : 'difiere de la operadora'}</span>}
                <span className="eb-hint">confianza {bot.confianza ?? '—'} · {bot.modelo ?? ''} · {bot.duracionMs ?? '—'} ms</span>
            </div>
            {bot.ejecucion && (() => {
                const ej = bot.ejecucion as any
                const partes: string[] = []
                if (ej.toma) partes.push(ej.toma.tomada ? 'tomado en Expendio' : `NO tomado: ${ej.toma.mensaje}`)
                if (bot.modoSombra === false && bot.accion) partes.push(`acción ${bot.accion}${ej.dryRun ? ' (simulada, no se mandó)' : ''}`)
                if (ej.resueltoPor) partes.push(`resolvió ${ej.resueltoPor}`)
                if (ej.motivoNoEjecuta) partes.push(ej.motivoNoEjecuta)
                if (ej.respuesta?.mensaje) partes.push(`Andes: ${ej.respuesta.mensaje}`)
                if (ej.auditoria) partes.push('pasó a auditoría')
                if (ej.error) partes.push(`error: ${ej.error}`)
                return <Campo label="Ejecución" valor={partes.join(' · ')} />
            })()}
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
                                <td><span style={{ color: '#6b7280', fontWeight: 600 }}>{i + 1} -</span> {p.texto}{p.codigoEscrito ? <span className="eb-cod"> [{p.codigoEscrito}]</span> : null}</td>
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
                <div className="eb-json-wrap">
                    <BotonCopiar texto={JSON.stringify({ lectura: bot.lectura, matching: bot.matchDetalle }, null, 2)} />
                    <pre className="eb-json">{JSON.stringify({ lectura: bot.lectura, matching: bot.matchDetalle }, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}

/** Copia el texto al portapapeles y avisa dos segundos. */
const BotonCopiar = ({ texto }: { texto: string }) => {
    const [copiado, setCopiado] = useState(false)
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(texto)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
        } catch {
            window.prompt('Copiá el texto:', texto)
        }
    }
    return (
        <button type="button" className="eb-json-copiar" onClick={copiar} title="Copiar el JSON">
            <FaCopy /> {copiado ? 'Copiado' : 'Copiar'}
        </button>
    )
}

export default EstudioBotDetalle
