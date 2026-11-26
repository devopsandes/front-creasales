// src/components/conversaciones/AuditoriaConversacionCard.tsx
// Ficha de auditoría de calidad de UNA conversación archivada (criterios de
// Karen, 25/10/2026). Por cada criterio se elige verde / amarillo / rojo / no
// aplica; los que el sistema puede leer del texto vienen precargados con una
// sugerencia y su evidencia, y la auditora confirma o corrige. Una sola
// auditoría por conversación: si ya existe, se edita. Fede, 26/11/2026.
import { useEffect, useMemo, useState } from "react"
import {
    getAuditoriaConversacion,
    guardarAuditoriaConversacion,
    AuditoriaCalificacion,
    AuditoriaChequeo,
    AuditoriaConversacion,
    AuditoriaCriterio,
} from "../../services/conversaciones/conversaciones.services"

export const ROLES_AUDITORES = ["ROOT", "ADMIN", "SUPER"]
export const puedeAuditar = (role: string | null | undefined) => ROLES_AUDITORES.includes(String(role ?? "").toUpperCase())

export const CALIFICACION_LABEL: Record<AuditoriaCalificacion, string> = {
    VERDE: "Verde",
    AMARILLO: "Amarillo",
    ROJO: "Rojo",
    NO_APLICA: "No aplica",
}

const OPCIONES: { valor: AuditoriaCalificacion; corto: string; title: string }[] = [
    { valor: "VERDE", corto: "V", title: "Verde: cumple" },
    { valor: "AMARILLO", corto: "A", title: "Amarillo: error de ortografía o gramática" },
    { valor: "ROJO", corto: "R", title: "Rojo: rompe el criterio" },
    { valor: "NO_APLICA", corto: "N/A", title: "No aplica a esta gestión" },
]

const capitalizeText = (text: string | undefined | null): string => {
    if (!text || typeof text !== "string") return ""
    return text.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

/** Rojo si hay algún rojo, amarillo si hay algún amarillo, verde si el resto (mismo cálculo que el back). */
const calcularGeneral = (valores: Record<string, AuditoriaCalificacion | undefined>): AuditoriaCalificacion | null => {
    const lista = Object.values(valores).filter(Boolean) as AuditoriaCalificacion[]
    if (!lista.length) return null
    if (lista.includes("ROJO")) return "ROJO"
    if (lista.includes("AMARILLO")) return "AMARILLO"
    return "VERDE"
}

type Props = {
    token: string
    conversacionId: string | null | undefined
    onAuthExpired?: (resp: any) => boolean
    /** Avisar al padre cuando se guarda (para refrescar el color en la lista). */
    onGuardada?: (auditoria: AuditoriaConversacion) => void
}

const AuditoriaConversacionCard = ({ token, conversacionId, onAuthExpired, onGuardada }: Props) => {
    const [loading, setLoading] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [criterios, setCriterios] = useState<AuditoriaCriterio[]>([])
    const [chequeos, setChequeos] = useState<AuditoriaChequeo[]>([])
    const [auditoria, setAuditoria] = useState<AuditoriaConversacion | null>(null)
    const [valores, setValores] = useState<Record<string, AuditoriaCalificacion | undefined>>({})
    const [comentarios, setComentarios] = useState<Record<string, string>>({})
    const [comentario, setComentario] = useState("")
    const [abierto, setAbierto] = useState(true)
    const [sucio, setSucio] = useState(false)

    useEffect(() => {
        if (!token || !conversacionId) return
        const controller = new AbortController()
        setLoading(true)
        setError(null)
        setSucio(false)
        getAuditoriaConversacion(token, conversacionId, { signal: controller.signal })
            .then((resp: any) => {
                if (onAuthExpired?.(resp)) return
                if (((resp as any)?.statusCode ?? 200) >= 400) {
                    setError("No se pudo cargar la auditoría.")
                    return
                }
                const cat: AuditoriaCriterio[] = Array.isArray(resp?.criterios) ? resp.criterios : []
                const chq: AuditoriaChequeo[] = Array.isArray(resp?.chequeos) ? resp.chequeos : []
                const aud: AuditoriaConversacion | null = resp?.auditoria ?? null
                setCriterios(cat)
                setChequeos(chq)
                setAuditoria(aud)

                // Lo guardado manda; si no hay nada guardado, se precargan las sugerencias automáticas.
                const v: Record<string, AuditoriaCalificacion | undefined> = {}
                const c: Record<string, string> = {}
                if (aud) {
                    for (const r of aud.criterios) { v[r.codigo] = r.calificacion; if (r.comentario) c[r.codigo] = r.comentario }
                } else {
                    for (const ch of chq) v[ch.codigo] = ch.sugerencia
                }
                setValores(v)
                setComentarios(c)
                setComentario(aud?.comentario ?? "")
            })
            .catch((err: any) => {
                if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return
                setError("No se pudo cargar la auditoría.")
            })
            .finally(() => setLoading(false))
        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, conversacionId])

    const chequeoPorCodigo = useMemo(() => new Map(chequeos.map((c) => [c.codigo, c])), [chequeos])
    const grupos = useMemo(() => {
        const out: { grupo: string; items: AuditoriaCriterio[] }[] = []
        for (const c of criterios) {
            const g = out.find((x) => x.grupo === c.grupo)
            if (g) g.items.push(c); else out.push({ grupo: c.grupo, items: [c] })
        }
        return out
    }, [criterios])

    const general = calcularGeneral(valores)
    const faltan = criterios.filter((c) => !valores[c.codigo]).length
    const completa = criterios.length > 0 && faltan === 0

    const setValor = (codigo: string, valor: AuditoriaCalificacion) => {
        setValores((prev) => ({ ...prev, [codigo]: valor }))
        setSucio(true)
    }

    const guardar = async () => {
        if (!token || !conversacionId || !completa || guardando) return
        setGuardando(true)
        setError(null)
        try {
            const resp = await guardarAuditoriaConversacion(token, conversacionId, {
                criterios: criterios.map((c) => ({
                    codigo: c.codigo,
                    calificacion: valores[c.codigo] as AuditoriaCalificacion,
                    comentario: comentarios[c.codigo]?.trim() || null,
                })),
                comentario: comentario.trim() || null,
            })
            if (onAuthExpired?.(resp)) return
            if (((resp as any)?.statusCode ?? 200) >= 400 || !resp?.auditoria) {
                const msg = Array.isArray((resp as any)?.message) ? (resp as any).message.join(" ") : (resp as any)?.message
                setError(msg || "No se pudo guardar la auditoría.")
                return
            }
            setAuditoria(resp.auditoria)
            setSucio(false)
            onGuardada?.(resp.auditoria)
        } catch {
            setError("No se pudo guardar la auditoría.")
        } finally {
            setGuardando(false)
        }
    }

    if (!conversacionId) return null

    const auditorLabel = auditoria?.auditor
        ? [capitalizeText(auditoria.auditor.nombre), capitalizeText(auditoria.auditor.apellido)].filter(Boolean).join(" ")
        : ""
    const fmt = (v: string | null | undefined) => v ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v)) : ""

    return (
        <div className="chat-info-panel-section auditoria-card">
            <div className="chat-info-panel-section-title">
                <span>Auditoría de calidad</span>
                <button type="button" className="auditoria-toggle" onClick={() => setAbierto((v) => !v)} title={abierto ? "Ocultar" : "Mostrar"}>
                    {abierto ? "−" : "+"}
                </button>
            </div>

            <div className="auditoria-resumen">
                {general ? (
                    <span className={`auditoria-badge auditoria-badge--${general.toLowerCase()}`}>{CALIFICACION_LABEL[general]}</span>
                ) : (
                    <span className="auditoria-badge auditoria-badge--pendiente">Sin auditar</span>
                )}
                {auditoria ? (
                    <span className="auditoria-meta">Auditó {auditorLabel || "—"} · {fmt(auditoria.updatedAt)}</span>
                ) : (
                    <span className="auditoria-meta">Precargado con los chequeos automáticos</span>
                )}
            </div>

            {loading && <div className="auditoria-meta">Cargando…</div>}
            {error && <div className="chat-info-panel-aviso chat-info-panel-aviso--error">{error}</div>}

            {abierto && !loading && criterios.length > 0 && (
                <>
                    {grupos.map((g) => (
                        <div key={g.grupo} className="auditoria-grupo">
                            <div className="auditoria-grupo-titulo">{g.grupo}</div>
                            {g.items.map((c) => {
                                const valor = valores[c.codigo]
                                const chequeo = chequeoPorCodigo.get(c.codigo)
                                return (
                                    <div key={c.codigo} className={`auditoria-criterio ${valor ? `auditoria-criterio--${valor.toLowerCase()}` : ""}`}>
                                        <div className="auditoria-criterio-head">
                                            <span className="auditoria-criterio-titulo" title={c.descripcion}>
                                                {c.numero}. {c.titulo}
                                                {c.automatico && <span className="auditoria-auto" title="El sistema sugiere este resultado leyendo los mensajes">auto</span>}
                                            </span>
                                            <div className="auditoria-opciones">
                                                {OPCIONES.map((o) => (
                                                    <button
                                                        type="button"
                                                        key={o.valor}
                                                        title={o.title}
                                                        className={`auditoria-opcion auditoria-opcion--${o.valor.toLowerCase()} ${valor === o.valor ? "auditoria-opcion--on" : ""}`}
                                                        onClick={() => setValor(c.codigo, o.valor)}
                                                    >
                                                        {o.corto}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {chequeo && (
                                            <div className="auditoria-evidencia" title="Evidencia del chequeo automático">
                                                {chequeo.evidencia}
                                            </div>
                                        )}
                                        {(valor === "ROJO" || valor === "AMARILLO" || comentarios[c.codigo]) && (
                                            <input
                                                className="auditoria-comentario-criterio"
                                                placeholder="Observación (opcional)"
                                                value={comentarios[c.codigo] ?? ""}
                                                onChange={(e) => { setComentarios((p) => ({ ...p, [c.codigo]: e.target.value })); setSucio(true) }}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}

                    <textarea
                        className="auditoria-comentario"
                        placeholder="Comentario general de la auditoría (opcional)"
                        rows={3}
                        value={comentario}
                        onChange={(e) => { setComentario(e.target.value); setSucio(true) }}
                    />

                    <div className="auditoria-acciones">
                        {!completa && <span className="auditoria-meta">Faltan {faltan} criterio{faltan === 1 ? "" : "s"} por calificar</span>}
                        <button type="button" className="auditoria-guardar" disabled={!completa || guardando || (!sucio && Boolean(auditoria))} onClick={guardar}>
                            {guardando ? "Guardando…" : auditoria ? "Guardar cambios" : "Guardar auditoría"}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default AuditoriaConversacionCard
