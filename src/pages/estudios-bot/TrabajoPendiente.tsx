// src/pages/estudios-bot/TrabajoPendiente.tsx
// Modo MANUAL: el formulario viene cargado con la propuesta del bot; la
// operadora corrige lo que haga falta y confirma. Lo que cambia se marca en
// rojo con lo que había puesto el bot.
import { useEffect, useMemo, useState } from "react"
import { FaCheck, FaPlus, FaTrash, FaExclamationTriangle, FaLock } from "react-icons/fa"
import LupaSelector from "./LupaSelector"
import {
    buscarDiagnosticos, buscarEfectores, buscarPrestaciones, buscarPrestadores, buscarSolicitantes,
    guardarDecisionEstudio, precioPrestacion, resolverEstudio,
} from "../../services/estudios-bot/estudiosBot.api"
import { CatMotivo, CatPrestacion, EstudioDetalle, PrestacionElegida, Ref, Veredicto } from "../../interfaces/estudios-bot.interface"
import { esTodoLaboratorio } from "./EstudiosBot"

const vacio: Ref = { id: null, nombre: null }
const fmtPesos = (n: number | string | null | undefined) =>
    n === null || n === undefined || n === '' ? '—' : `$ ${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
const nombreRef = (r: Ref | undefined, conMat = false, conCod = false) => {
    if (!r?.nombre) return ''
    if (conMat) return `${r.nombre} (Mat.:${r.matricula ?? ''})`
    if (conCod) return `${r.nombre} (Cod.:${r.codigo ?? ''})`
    return r.nombre
}

/** Debajo de cada campo: qué propuso el bot y si se cambió. */
const Propuesta = ({ actual, bot }: { actual: string | null | undefined; bot: string | null | undefined }) => {
    const a = String(actual ?? ''), b = String(bot ?? '')
    if (a === b) return <span className="eb-hint">Propuesta del bot</span>
    return <span className="eb-hint" style={{ color: '#991b1b', fontWeight: 600 }}>Cambiaste. El bot había puesto: {b || '— (nada)'}</span>
}

type Props = {
    detalle: EstudioDetalle
    motivos: CatMotivo[]
    onResuelto: (d: EstudioDetalle) => void
    avisar: (tipo: 'ok' | 'err', msg: string) => void
    /**
     * Solicitud con varios pedidos: codificar y rechazar se GUARDAN como
     * decisión del pedido y el conjunto sale con "Confirmar solicitud";
     * derivar deriva la solicitud completa.
     */
    modoGrupo?: boolean
}

const TrabajoPendiente = ({ detalle, motivos, onResuelto, avisar, modoGrupo = false }: Props) => {
    const bot = detalle.bot!
    const idAfiliado = detalle.id_afiliado ?? ''
    const bloqueado = Boolean(detalle.bloqueo && !detalle.bloqueo.tomada)
    // Modo grupo: si ya hay una decisión guardada, el formulario arranca con ella.
    const guardada = modoGrupo && detalle.operadora && detalle.operadora.veredicto !== 'DERIVAR' ? detalle.operadora : null
    const decisionGuardada = detalle.multi?.decisiones.find((d) => d.analisisId === detalle.id)?.decision ?? null

    const [prestador, setPrestador] = useState<Ref>(guardada?.prestador?.id ? guardada.prestador : bot.prestador?.id ? bot.prestador : vacio)
    const [solicitante, setSolicitante] = useState<Ref>(guardada?.solicitante?.id ? guardada.solicitante : bot.solicitante?.id ? bot.solicitante : vacio)
    const [diagnostico, setDiagnostico] = useState<Ref>(guardada?.diagnostico?.id ? guardada.diagnostico : bot.diagnostico?.id ? bot.diagnostico : vacio)
    const [efector, setEfector] = useState<Ref>(guardada?.efector?.id ? guardada.efector : bot.efector?.id ? bot.efector : vacio)
    const [prestaciones, setPrestaciones] = useState<PrestacionElegida[]>((guardada ? guardada.prestaciones : bot.prestaciones).filter((p) => p.idCodigo))
    const [accion, setAccion] = useState<Veredicto>(guardada?.veredicto ?? bot.veredicto)
    const [motivoId, setMotivoId] = useState(guardada?.motivo?.id ?? bot.motivo?.id ?? '')
    const [comentario, setComentario] = useState(guardada?.comentario ?? '')
    const [prestacionTemp, setPrestacionTemp] = useState<CatPrestacion | null>(null)
    const [cantidadTemp, setCantidadTemp] = useState(1)
    const [enviando, setEnviando] = useState(false)

    // Aviso de Andes: prestación ya registrada en los últimos 60 días. Informativo.
    // Al abrir, si la propuesta del bot trae alguna; después, cada vez que se agrega una.
    const [modalAlerta, setModalAlerta] = useState<{ nombres: string[]; frase: string } | null>(() => {
        const conAviso = bot.prestaciones.filter((p) => p.idCodigo && p.alertaDuplicacion)
        return conAviso.length
            ? { nombres: conAviso.map((p) => p.descripcion ?? p.codigo ?? ''), frase: conAviso[0].alertaDuplicacion as string }
            : null
    })
    const [entendido, setEntendido] = useState(false)

    const motivoSel = useMemo(() => motivos.find((m) => m.idMensaje === motivoId) ?? null, [motivos, motivoId])

    // Comentario para el afiliado: arranca con la plantilla del motivo y la operadora lo edita, como en Expendio.
    const [textoAfiliado, setTextoAfiliado] = useState('')
    useEffect(() => {
        // Decisión guardada con el mismo motivo: se respeta el texto que editó la operadora.
        if (guardada && decisionGuardada?.textoAfiliado && motivoSel?.idMensaje === guardada.motivo?.id) {
            setTextoAfiliado(decisionGuardada.textoAfiliado)
            return
        }
        setTextoAfiliado(motivoSel?.texto ?? '')
    }, [motivoSel?.idMensaje]) // eslint-disable-line react-hooks/exhaustive-deps

    // Misma regla que el back para saber qué se corrigió.
    const cambios = useMemo(() => {
        const id = (v: any) => String(v ?? '')
        const dif: string[] = []
        if (accion !== bot.veredicto) dif.push('veredicto')
        if (accion === 'RECHAZAR' && id(motivoId) !== id(bot.motivo?.id)) dif.push('motivo')
        if (accion === 'CODIFICAR') {
            if (id(prestador.id) !== id(bot.prestador?.id)) dif.push('prestador')
            if (id(solicitante.id) !== id(bot.solicitante?.id)) dif.push('solicitante')
            if (id(diagnostico.id) !== id(bot.diagnostico?.id)) dif.push('diagnóstico')
            if (id(efector.id) !== id(bot.efector?.id)) dif.push('efector')
            const clave = (ps: PrestacionElegida[]) => ps.filter((p) => p.idCodigo).map((p) => `${p.idCodigo}x${p.cantidad ?? 1}`).sort().join('|')
            if (clave(prestaciones) !== clave(bot.prestaciones)) dif.push('prestaciones')
        }
        return dif
    }, [accion, motivoId, prestador, solicitante, diagnostico, efector, prestaciones, bot])

    const total = prestaciones.reduce((s, p) => s + (p.importeConvenido ?? 0) * (p.cantidad ?? 1), 0)
    const sinPrecio = prestaciones.some((p) => p.importeConvenido === null || p.importeConvenido === undefined)
    const tope = detalle.botTope ? Number(detalle.botTope) : null
    // Todo laboratorio no tiene tope.
    const superaTope = tope !== null && !sinPrecio && total > tope && !esTodoLaboratorio(prestaciones)

    const conPrecio = async (p: PrestacionElegida): Promise<PrestacionElegida> => {
        if (!prestador.id || !efector.id || !p.idCodigo || !idAfiliado) return { ...p, importeConvenido: null }
        try {
            const r = await precioPrestacion(prestador.id, p.idCodigo, idAfiliado, efector.id)
            return { ...p, importeConvenido: r.importeConvenido ?? null, coseguro: r.coseguro ?? null, alertaDuplicacion: r.alertaDuplicacion ?? null }
        } catch {
            return { ...p, importeConvenido: null }
        }
    }

    const agregar = async () => {
        if (!prestacionTemp) return
        const nueva = await conPrecio({
            idCodigo: prestacionTemp.idCodigo, codigo: prestacionTemp.codigo, descripcion: prestacionTemp.descCodigo,
            cantidad: Math.max(1, cantidadTemp), texto: '(agregada por la operadora)',
        })
        setPrestaciones((prev) => [...prev, nueva])
        if (nueva.alertaDuplicacion) {
            setEntendido(false)
            setModalAlerta({ nombres: [nueva.descripcion ?? nueva.codigo ?? ''], frase: nueva.alertaDuplicacion })
        }
        setPrestacionTemp(null)
        setCantidadTemp(1)
    }

    const cambiarPrestador = (p: { idConvenio: string; nombreConvenio: string }) => {
        setPrestador({ id: p.idConvenio, nombre: p.nombreConvenio })
        setEfector(vacio)
        setPrestaciones([])
    }

    const cambiarEfector = async (e: { idProfesional: string; nombreProfesional: string }) => {
        setEfector({ id: e.idProfesional, nombre: e.nombreProfesional })
        // El precio depende del efector: se recalcula.
        if (prestador.id && idAfiliado) {
            const conPrecios = await Promise.all(prestaciones.map(async (p) => {
                if (!p.idCodigo) return p
                try {
                    const r = await precioPrestacion(prestador.id!, p.idCodigo, idAfiliado, e.idProfesional)
                    return { ...p, importeConvenido: r.importeConvenido ?? null, coseguro: r.coseguro ?? null, alertaDuplicacion: r.alertaDuplicacion ?? null }
                } catch { return { ...p, importeConvenido: null } }
            }))
            setPrestaciones(conPrecios)
        }
    }

    const validar = (): string | null => {
        if (bloqueado) return 'Este pedido lo tiene otra persona en Expendio'
        if (accion === 'RECHAZAR' && !motivoSel) return 'Elegí el motivo de rechazo'
        if (accion === 'CODIFICAR') {
            if (!prestador.id) return 'Falta el prestador'
            if (!solicitante.id) return 'Falta el profesional solicitante'
            if (!diagnostico.id) return 'Falta el diagnóstico'
            if (!efector.id) return 'Falta el profesional efector'
            if (!prestaciones.length) return 'Agregá al menos una prestación'
            if (prestaciones.some((p) => !p.cantidad || p.cantidad < 1)) return 'Falta la cantidad en alguna prestación'
        }
        if (cambios.length && comentario.trim().length < 5) return `Cambiaste ${cambios.join(', ')}: explicá por qué en el comentario`
        if (accion === 'DERIVAR' && comentario.trim().length < 5) return 'Al derivar explicá por qué en el comentario'
        return null
    }

    const confirmar = async () => {
        const err = validar()
        if (err) { avisar('err', err); return }
        setEnviando(true)
        try {
            // Modo grupo: codificar y rechazar solo se guardan; derivar sigue siendo inmediato (deriva todo).
            const enviar = modoGrupo && accion !== 'DERIVAR' ? guardarDecisionEstudio : resolverEstudio
            const r = await enviar(detalle.id, {
                accion,
                veredicto: accion,
                motivo: motivoSel ? { id: motivoSel.idMensaje, texto: motivoSel.tema } : undefined,
                textoAfiliado: accion === 'RECHAZAR' ? (textoAfiliado.trim() || undefined) : undefined,
                comentario: comentario.trim() || undefined,
                prestador: { id: prestador.id, nombre: prestador.nombre },
                solicitante: { id: solicitante.id, nombre: solicitante.nombre, matricula: solicitante.matricula },
                diagnostico: { id: diagnostico.id, nombre: diagnostico.nombre, codigo: diagnostico.codigo },
                efector: { id: efector.id, nombre: efector.nombre },
                prestaciones: prestaciones.map((p) => ({ idCodigo: p.idCodigo, codigo: p.codigo, descripcion: p.descripcion, cantidad: p.cantidad })),
            })
            if (!r.id) {
                const m = Array.isArray(r.message) ? r.message.join(', ') : r.message
                throw new Error(m ?? 'No se pudo resolver')
            }
            avisar('ok', modoGrupo && accion !== 'DERIVAR'
                ? `Decisión guardada para el pedido ${detalle.multi?.pedido ?? ''}: ${accion === 'CODIFICAR' ? 'codificar' : 'rechazar'}`
                : accion === 'CODIFICAR' ? 'Orden codificada' : accion === 'RECHAZAR' ? 'Pedido rechazado' : 'Derivado a Expendio')
            onResuelto(r)
        } catch (e) {
            avisar('err', e instanceof Error ? e.message : 'Error al resolver')
        } finally {
            setEnviando(false)
        }
    }

    const etiqueta = accion === 'CODIFICAR' ? 'Codificar' : accion === 'RECHAZAR' ? 'Rechazar' : 'Derivar'
    const botPrestaciones = bot.prestaciones.filter((p) => p.idCodigo).map((p) => `${p.descripcion} x${p.cantidad ?? 1}`).join(' · ')
    const rojo = (campo: string) => cambios.includes(campo) ? { borderLeft: '3px solid #dc2626', paddingLeft: '.5rem' } : {}
    const sesionesKine = ((bot.matchDetalle as any)?.sesionesKine ?? []) as { texto: string; pedidas: number | null; autorizadas: number }[]
    // Mismo código cargado más de una vez. Solo aviso, no bloquea.
    const duplicadas = Object.values(prestaciones.reduce((acc, p) => {
        if (!p.idCodigo) return acc
        const previa = acc[p.idCodigo]
        acc[p.idCodigo] = previa ? { ...previa, veces: previa.veces + 1 } : { nombre: p.descripcion ?? p.codigo ?? '', veces: 1 }
        return acc
    }, {} as Record<string, { nombre: string; veces: number }>)).filter((d) => d.veces > 1)

    return (
        <div>
            {bloqueado && (
                <div className="eb-error-banner"><FaLock /> <span>{detalle.bloqueo?.mensaje || 'Este pedido lo tiene otra persona en Expendio'}. No se puede resolver desde acá.</span></div>
            )}

            <div className="eb-subtitle" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>¿Qué hacemos con este pedido?</div>
            <div className="eb-veredictos">
                {(['CODIFICAR', 'RECHAZAR', 'DERIVAR'] as Veredicto[]).map((v) => (
                    <label key={v} className={`eb-veredicto-opt ${accion === v ? `eb-sel-${v.toLowerCase()}` : ''}`}>
                        <input type="radio" name="accion" checked={accion === v} onChange={() => setAccion(v)} />
                        {v === 'CODIFICAR' ? 'Codificar' : v === 'RECHAZAR' ? 'Rechazar' : modoGrupo ? 'Derivar la solicitud completa' : 'Derivar (resolver en Expendio)'}
                        {bot.veredicto === v && <span className="eb-tag-prueba" style={{ marginLeft: '.4rem' }}>BOT</span>}
                    </label>
                ))}
            </div>
            <Propuesta actual={accion} bot={bot.veredicto} />

            {accion === 'RECHAZAR' && (
                <div className="eb-field" style={rojo('motivo')}>
                    <label className="eb-label">Motivo de rechazo</label>
                    <select className="eb-input" value={motivoId} onChange={(e) => setMotivoId(e.target.value)}>
                        <option value="">Elegí un motivo...</option>
                        {motivos.map((m) => <option key={m.idMensaje} value={m.idMensaje}>{m.tema}</option>)}
                    </select>
                    <Propuesta actual={motivoSel?.tema ?? ''} bot={bot.motivo?.texto ?? ''} />
                    {motivoSel && (
                        <div className="eb-field">
                            <label className="eb-label">Comentario para el afiliado (es lo que le llega a la app)</label>
                            <textarea className="eb-input eb-textarea" rows={5} maxLength={1000} value={textoAfiliado}
                                onChange={(e) => setTextoAfiliado(e.target.value)} />
                            <span className="eb-hint">Editalo como en Expendio: completá el número de trámite, el correo o lo que haga falta.</span>
                        </div>
                    )}
                </div>
            )}

            {accion === 'DERIVAR' && (
                <span className="eb-hint" style={{ marginTop: '.75rem' }}>
                    No se manda nada a Andes. {modoGrupo ? 'Toda la solicitud (todos sus pedidos) queda en Expendio para resolverla allá.' : 'El pedido queda en Expendio para resolverlo allá.'}
                </span>
            )}

            {accion === 'CODIFICAR' && (
                <>
                    <div className="eb-subtitle">Datos de la orden</div>
                    <div style={rojo('prestador')}>
                        <LupaSelector label="Prestador" valor={prestador.nombre ?? ''} buscar={buscarPrestadores}
                            mapear={(p) => ({ id: p.idConvenio, titulo: p.nombreConvenio })} onSeleccionar={cambiarPrestador} />
                        <Propuesta actual={prestador.nombre} bot={bot.prestador?.nombre} />
                    </div>
                    <div style={rojo('solicitante')}>
                        <LupaSelector label="Profesional solicitante" valor={nombreRef(solicitante, true)} buscar={buscarSolicitantes}
                            mapear={(p) => ({ id: p.idProfesional, titulo: p.nombre, subtitulo: `Mat. ${p.matricula}` })}
                            onSeleccionar={(p) => setSolicitante({ id: p.idProfesional, nombre: p.nombre, matricula: p.matricula })}
                            onLimpiar={() => setSolicitante(vacio)} />
                        <Propuesta actual={nombreRef(solicitante, true)} bot={nombreRef(bot.solicitante, true)} />
                    </div>
                    <div style={rojo('diagnóstico')}>
                        <LupaSelector label="Diagnóstico" valor={nombreRef(diagnostico, false, true)} buscar={buscarDiagnosticos}
                            mapear={(d) => ({ id: d.idDiagnostico, titulo: d.descDiagnostico, subtitulo: d.codigoDiagnostico })}
                            onSeleccionar={(d) => setDiagnostico({ id: d.idDiagnostico, nombre: d.descDiagnostico, codigo: d.codigoDiagnostico })}
                            onLimpiar={() => setDiagnostico(vacio)} />
                        <Propuesta actual={nombreRef(diagnostico, false, true)} bot={nombreRef(bot.diagnostico, false, true)} />
                    </div>
                    <div style={rojo('efector')}>
                        <LupaSelector label="Profesional (efector)" valor={efector.nombre ?? ''} disabled={!prestador.id}
                            buscar={(q) => buscarEfectores(prestador.id ?? '', q)}
                            mapear={(e) => ({ id: e.idProfesional, titulo: e.nombreProfesional, subtitulo: e.matricula })}
                            onSeleccionar={cambiarEfector} onLimpiar={() => setEfector(vacio)} />
                        <Propuesta actual={efector.nombre} bot={bot.efector?.nombre} />
                    </div>

                    <div className="eb-subtitle">Prestaciones</div>
                    <div style={rojo('prestaciones')}>
                        <div className="eb-prest-add">
                            <div className="eb-prest-add-lupa">
                                <LupaSelector label="Agregar prestación" valor={prestacionTemp ? `(Cod: ${prestacionTemp.codigo}) ${prestacionTemp.descCodigo}` : ''}
                                    disabled={!prestador.id || !idAfiliado}
                                    buscar={(q) => buscarPrestaciones(prestador.id ?? '', idAfiliado, q)}
                                    mapear={(p) => ({ id: p.idCodigo, titulo: p.descCodigo, subtitulo: `Cod. ${p.codigo}` })}
                                    onSeleccionar={setPrestacionTemp} />
                            </div>
                            <div className="eb-prest-add-cant">
                                <label className="eb-label">Cantidad</label>
                                <input type="number" min={1} className="eb-input" value={cantidadTemp || ''} onChange={(e) => setCantidadTemp(Math.max(0, Math.floor(Number(e.target.value)) || 0))} />
                            </div>
                            <button type="button" className="eb-btn-plus" onClick={agregar} disabled={!prestacionTemp} title="Agregar"><FaPlus /></button>
                        </div>
                        <table className="eb-mini-table">
                            <thead><tr><th>Descripción</th><th>Leído en el pedido</th><th style={{ width: 70 }}>Cant.</th><th>$ conv.</th><th></th></tr></thead>
                            <tbody>
                                {prestaciones.length === 0 && <tr><td colSpan={5} className="eb-empty-sm">Sin prestaciones</td></tr>}
                                {prestaciones.map((p, i) => (
                                    <tr key={`${p.idCodigo}-${i}`}>
                                        <td>
                                            <span style={{ color: '#6b7280', fontWeight: 600 }}>{i + 1} -</span>{' '}
                                            {p.alertaDuplicacion && <span title={p.alertaDuplicacion} style={{ color: '#b45309' }}>⚠ </span>}
                                            {p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span>
                                        </td>
                                        <td className="eb-cod">{p.texto ?? ''}</td>
                                        <td>
                                            <input type="number" min={1} className="eb-input" style={{ padding: '.3rem .4rem', width: 60 }} value={p.cantidad || ''}
                                                onChange={(e) => setPrestaciones((prev) => prev.map((x, j) => j === i ? { ...x, cantidad: Math.max(0, Math.floor(Number(e.target.value)) || 0) } : x))}
                                                onBlur={() => setPrestaciones((prev) => prev.map((x, j) => j === i && !x.cantidad ? { ...x, cantidad: 1 } : x))} />
                                        </td>
                                        <td>{fmtPesos(p.importeConvenido)}</td>
                                        <td><button type="button" className="eb-btn-icon-del" onClick={() => setPrestaciones((prev) => prev.filter((_, j) => j !== i))} title="Quitar"><FaTrash /></button></td>
                                    </tr>
                                ))}
                                {prestaciones.length > 0 && (
                                    <tr><td colSpan={3} style={{ textAlign: 'right' }}><b>Total convenido</b></td><td><b>{sinPrecio ? '—' : fmtPesos(total)}</b></td><td></td></tr>
                                )}
                            </tbody>
                        </table>
                        <Propuesta actual={cambios.includes('prestaciones') ? 'cambiado' : 'igual'} bot={cambios.includes('prestaciones') ? botPrestaciones : 'igual'} />
                        {sesionesKine.map((s, i) => (
                            <span key={i} className="eb-hint">
                                Kinesiología: {s.pedidas ? `el pedido dice ${s.pedidas} sesiones` : 'el pedido no dice cantidad'}; se proponen {s.autorizadas}. Las restantes se autorizan después con el mismo pedido.
                            </span>
                        ))}
                        {duplicadas.map((d, i) => (
                            <span key={`dup-${i}`} className="eb-hint" style={{ color: '#b45309' }}>
                                {d.nombre} está cargada {d.veces} veces.
                            </span>
                        ))}
                        {superaTope && (
                            <div className="eb-error-banner" style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
                                <FaExclamationTriangle /> <span>El total {fmtPesos(total)} supera el tope {fmtPesos(tope)} ({detalle.afiliadoCategoria}). Podés codificar igual.</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="eb-field">
                <label className="eb-label">
                    Comentario {cambios.length
                        ? '(obligatorio: cambiaste ' + cambios.join(', ') + ')'
                        : accion === 'DERIVAR' ? '(obligatorio: al derivar explicá por qué)' : '(opcional)'}
                </label>
                <textarea className="eb-input eb-textarea" rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)}
                    placeholder={cambios.length
                        ? 'Por qué corregiste lo del bot...'
                        : accion === 'DERIVAR' ? 'Por qué lo derivás...' : 'Si confirmás tal cual, no hace falta'} />
            </div>

            <div className="eb-actions">
                {modoGrupo && accion !== 'DERIVAR' ? (
                    <>
                        <span className="eb-hint" style={{ marginRight: 'auto' }}>
                            {guardada ? 'Ya hay una decisión guardada para este pedido; guardar de nuevo la reemplaza.' : 'Nada sale hacia Andes hasta "Confirmar solicitud completa".'}
                        </span>
                        <button className="eb-btn-primary" onClick={confirmar} disabled={enviando || bloqueado}>
                            <FaCheck /> {enviando ? 'Guardando...' : `Guardar decisión: ${etiqueta.toLowerCase()}${cambios.length ? ' (corregido)' : ''}`}
                        </button>
                    </>
                ) : (
                    <button className="eb-btn-primary" onClick={confirmar} disabled={enviando || bloqueado}>
                        <FaCheck /> {enviando ? 'Enviando...' : `${etiqueta}${cambios.length ? ' (corregido)' : ' tal como propuso el bot'}`}
                    </button>
                )}
            </div>

            {modalAlerta && (
                <div className="eb-modal-overlay">
                    <div className="eb-modal" style={{ maxWidth: 560 }}>
                        <div className="eb-modal-header" style={{ background: '#b45309' }}>
                            <h3 className="eb-modal-title"><FaExclamationTriangle /> Prestación ya registrada</h3>
                        </div>
                        <div className="eb-modal-body" style={{ padding: '1.25rem' }}>
                            <p style={{ margin: '0 0 .75rem', fontSize: '.875rem', color: '#111827' }}>{modalAlerta.frase}</p>
                            <ul style={{ margin: '0 0 1rem 1.1rem', padding: 0, fontSize: '.875rem' }}>
                                {modalAlerta.nombres.map((n, i) => <li key={i}><b>{n}</b></li>)}
                            </ul>
                            <label style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', fontSize: '.875rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={entendido} onChange={(e) => setEntendido(e.target.checked)} style={{ marginTop: 3 }} />
                                <span>
                                    Entiendo que {modalAlerta.nombres.length > 1 ? 'las prestaciones' : 'la prestación'} <b>{modalAlerta.nombres.join(', ')}</b>{' '}
                                    {modalAlerta.nombres.length > 1 ? 'ya fueron cargadas' : 'ya fue cargada'} en un lapso menor a 60 días para este mismo afiliado.
                                </span>
                            </label>
                            <div className="eb-actions">
                                <button className="eb-btn-primary" disabled={!entendido} onClick={() => { setModalAlerta(null); setEntendido(false) }}>
                                    Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TrabajoPendiente