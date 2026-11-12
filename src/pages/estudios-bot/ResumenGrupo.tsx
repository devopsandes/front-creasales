// src/pages/estudios-bot/ResumenGrupo.tsx
// Solicitud de la app con varias fotos (Etapa 2): antes de mandar algo a Andes,
// la operadora ve foto por foto qué va a pasar y confirma el conjunto.
import { useEffect, useState } from "react"
import { FaCheck, FaExclamationTriangle, FaSearchPlus, FaSync, FaTimes } from "react-icons/fa"
import { confirmarGrupoEstudios, obtenerImagenEstudio } from "../../services/estudios-bot/estudiosBot.api"
import { DecisionPedido, EstudioDetalle, MultiFoto } from "../../interfaces/estudios-bot.interface"

const fmtPesos = (n: number | string | null | undefined) =>
    n === null || n === undefined || n === '' ? '—' : `$ ${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

const ROL_TXT: Record<MultiFoto['rol'], string> = {
    PEDIDO: 'Pedido médico',
    CERTIFICADO: 'Certificado de embarazo',
    CONTINUACION: 'Continuación',
    DUPLICADA: 'Repetida',
    NO_PEDIDO: 'No es un pedido médico',
}

type Props = {
    detalle: EstudioDetalle
    onClose: () => void
    onConfirmado: (d: EstudioDetalle) => void
    avisar: (tipo: 'ok' | 'err', msg: string) => void
}

/** Qué va a pasar con una foto, según el rol del bot y la decisión guardada del pedido al que pertenece. */
const Resolucion = ({ foto, decision }: { foto: MultiFoto; decision: DecisionPedido | null }) => {
    if (!decision) {
        if (foto.rol === 'CONTINUACION') return <div className="eb-res-txt"><b>Parte del pedido de la foto {foto.de}</b>. Se resuelve con ese pedido.</div>
        return (
            <div className="eb-res-txt">
                <span className="eb-badge eb-badge-gris">DESCARTADA</span> {foto.motivo ?? ROL_TXT[foto.rol]}.
                <div className="eb-hint">No se carga ni se avisa nada al afiliado por esta foto.</div>
            </div>
        )
    }
    const d = decision.decision
    if (decision.estado !== 'PENDIENTE') {
        return <div className="eb-res-txt"><span className="eb-badge eb-badge-gris">YA RESUELTO</span> Pedido {decision.pedido}: {decision.accion ?? decision.estado}.</div>
    }
    if (!d) return <div className="eb-res-txt"><span className="eb-badge eb-badge-amarillo">SIN DECISIÓN</span> Pedido {decision.pedido}: falta guardar qué hacer.</div>
    if (d.accion === 'CODIFICAR') {
        return (
            <div className="eb-res-txt">
                <span className="eb-badge eb-badge-verde">CODIFICAR</span> Pedido {decision.pedido} · {d.prestador ?? '—'}
                <ul className="eb-res-lista">
                    {d.prestaciones.map((p, i) => (
                        <li key={i}>{p.descripcion} <span className="eb-cod">(Cod.:{p.codigo})</span> x{p.cantidad} · {fmtPesos(p.importeConvenido)}</li>
                    ))}
                </ul>
                <div><b>Total convenido: {fmtPesos(d.total)}</b></div>
            </div>
        )
    }
    return (
        <div className="eb-res-txt">
            <span className="eb-badge eb-badge-rojo">RECHAZAR</span> Pedido {decision.pedido} · {d.motivoTexto ?? 'sin motivo'}
            <div className="eb-res-mensaje">
                <span className="eb-hint">Mensaje al afiliado:</span>
                <div>{d.textoAfiliado || <i>(la plantilla del motivo, sin editar)</i>}</div>
            </div>
        </div>
    )
}

const ResumenGrupo = ({ detalle, onClose, onConfirmado, avisar }: Props) => {
    const multi = detalle.multi!
    const [urls, setUrls] = useState<Record<number, string>>({})
    const [grande, setGrande] = useState<number | null>(null)
    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        let vivo = true
        multi.fotos.forEach((f) => {
            obtenerImagenEstudio(detalle.id, f.n)
                .then((r) => { if (vivo && r.url) setUrls((prev) => ({ ...prev, [f.n]: r.url as string })) })
                .catch(() => { })
        })
        return () => { vivo = false }
    }, [detalle.id, multi.fotos])

    const pendientes = multi.decisiones.filter((d) => d.estado === 'PENDIENTE')
    const codificar = pendientes.filter((d) => d.decision?.accion === 'CODIFICAR')
    const rechazar = pendientes.filter((d) => d.decision?.accion === 'RECHAZAR')
    const mixto = codificar.length > 0 && rechazar.length > 0
    const todoRechazo = codificar.length === 0 && rechazar.length > 0

    const confirmar = async () => {
        if (!multi.grupo) return
        setEnviando(true)
        try {
            const r = await confirmarGrupoEstudios(multi.grupo)
            if (!r.id) {
                const m = Array.isArray(r.message) ? r.message.join(', ') : r.message
                throw new Error(m ?? 'No se pudo confirmar la solicitud')
            }
            avisar('ok', codificar.length
                ? `Solicitud confirmada: ${codificar.length} orden${codificar.length > 1 ? 'es' : ''} codificada${codificar.length > 1 ? 's' : ''}${rechazar.length ? ` y ${rechazar.length} pedido${rechazar.length > 1 ? 's' : ''} rechazado${rechazar.length > 1 ? 's' : ''}` : ''}`
                : 'Solicitud rechazada en Expendio')
            onConfirmado(r)
        } catch (e) {
            avisar('err', e instanceof Error ? e.message : 'Error al confirmar')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="eb-modal-overlay" onClick={() => !enviando && onClose()}>
            <div className="eb-modal eb-modal-resumen" onClick={(e) => e.stopPropagation()}>
                <div className="eb-modal-header">
                    <span className="eb-modal-title">Confirmar solicitud completa · {multi.total} fotos · {pendientes.length} pedido{pendientes.length === 1 ? '' : 's'}</span>
                    <button type="button" className="eb-modal-close" onClick={onClose} disabled={enviando} title="Cerrar"><FaTimes /></button>
                </div>
                <div className="eb-modal-body eb-resumen-body">
                    {multi.fotos.map((f) => {
                        const decision = f.analisisId ? multi.decisiones.find((d) => d.analisisId === f.analisisId) ?? null : null
                        // La continuación muestra la resolución de su pedido sin repetirla: solo la referencia.
                        const propia = decision && decision.imagenes[0] === f.n ? decision : null
                        return (
                            <div key={f.n} className="eb-resumen-fila">
                                <div className="eb-thumb-wrap">
                                    {urls[f.n]
                                        ? <img src={urls[f.n]} alt={`Foto ${f.n}`} className="eb-thumb" onClick={() => setGrande(f.n)} />
                                        : <div className="eb-thumb eb-thumb-vacia">Cargando...</div>}
                                    <button type="button" className="eb-thumb-lupa" onClick={() => setGrande(f.n)} title="Agrandar" disabled={!urls[f.n]}><FaSearchPlus /></button>
                                    <div className="eb-thumb-pie">Foto {f.n} · {ROL_TXT[f.rol]}</div>
                                </div>
                                <Resolucion foto={f} decision={propia ?? (decision && f.rol === 'CONTINUACION' ? null : decision)} />
                            </div>
                        )
                    })}

                    {mixto && !multi.mensajesParciales && (
                        <div className="eb-error-banner" style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
                            <FaExclamationTriangle />
                            <span>Se codifican {codificar.length} y se rechazan {rechazar.length}. <b>El afiliado no recibe aviso por los pedidos rechazados</b> hasta que la app lo soporte: si hace falta, avisale por otro medio.</span>
                        </div>
                    )}
                    {mixto && multi.mensajesParciales && (
                        <div className="eb-error-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e3a8a' }}>
                            <span>Se codifican {codificar.length} y, por cada pedido rechazado, el afiliado recibe el mensaje en la app.</span>
                        </div>
                    )}
                    {todoRechazo && (
                        <div className="eb-error-banner" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
                            <span>No se codifica nada: la solicitud se rechaza en Expendio con el motivo del pedido {rechazar[0].pedido}{rechazar.length > 1 ? ' y los mensajes de todos los pedidos, uno debajo del otro' : ''}.</span>
                        </div>
                    )}
                </div>
                <div className="eb-modal-acciones eb-resumen-acciones">
                    <button type="button" className="eb-btn-secondary" onClick={onClose} disabled={enviando}>Volver</button>
                    <button type="button" className="eb-btn-primary" onClick={confirmar} disabled={enviando || !multi.confirmable}>
                        {enviando ? <><FaSync className="spinning" /> Enviando a Andes...</> : <><FaCheck /> Confirmar</>}
                    </button>
                </div>
            </div>

            {grande !== null && urls[grande] && (
                <div className="eb-lightbox" onClick={(e) => { e.stopPropagation(); setGrande(null) }}>
                    <img src={urls[grande]} alt={`Foto ${grande}`} />
                    <span className="eb-lightbox-pie">Foto {grande} · clic para cerrar</span>
                </div>
            )}
        </div>
    )
}

export default ResumenGrupo
