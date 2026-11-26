// src/pages/conversaciones/ReporteAuditorias.tsx
// Reporte de auditorías de calidad (KPI 7 del instructivo de Karen): cuántas
// verdes / amarillas / rojas tiene el área y cada operadora en el rango, y qué
// criterios fallan más. El rango es por fecha de cierre de la conversación,
// igual que la lista. Solo para ROOT / ADMIN / SUPER. Fede, 26/11/2026.
import { useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Calendar, User } from "lucide-react"
import { useDispatch } from "react-redux"
import { getAuditoriasReporte, AuditoriasReporteResponse } from "../../services/conversaciones/conversaciones.services"
import { usuariosXRole } from "../../services/auth/auth.services"
import { Usuario } from "../../interfaces/auth.interface"
import { getAuthSessionReason } from "../../utils/authSession"
import { openSessionExpired } from "../../app/slices/actionSlice"
import { puedeAuditar } from "../../components/conversaciones/AuditoriaConversacionCard"
import ConversacionesTabs from "./ConversacionesTabs"
import "../chats/chats.css"

const capitalizeText = (text: string | undefined | null): string => {
    if (!text || typeof text !== "string") return ""
    return text.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

const toInputDate = (d: Date) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}
const hoy = () => toInputDate(new Date())
const haceDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toInputDate(d) }

const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0

/** Barra apilada verde / amarillo / rojo. */
const Barra = ({ verde, amarillo, rojo }: { verde: number; amarillo: number; rojo: number }) => {
    const total = verde + amarillo + rojo
    if (total === 0) return <div className="rep-barra rep-barra--vacia" />
    return (
        <div className="rep-barra" title={`Verde ${verde} · Amarillo ${amarillo} · Rojo ${rojo}`}>
            {verde > 0 && <div className="rep-barra-seg rep-barra-seg--verde" style={{ width: `${(verde / total) * 100}%` }} />}
            {amarillo > 0 && <div className="rep-barra-seg rep-barra-seg--amarillo" style={{ width: `${(amarillo / total) * 100}%` }} />}
            {rojo > 0 && <div className="rep-barra-seg rep-barra-seg--rojo" style={{ width: `${(rojo / total) * 100}%` }} />}
        </div>
    )
}

const ReporteAuditorias = () => {
    const dispatch = useDispatch()
    const token = localStorage.getItem("token") || ""
    const esAuditor = puedeAuditar(localStorage.getItem("role"))

    const [desde, setDesde] = useState<string>(haceDias(30))
    const [hasta, setHasta] = useState<string>(hoy())
    const [operatorId, setOperatorId] = useState<string>("")
    const [operadores, setOperadores] = useState<Usuario[]>([])
    const [data, setData] = useState<AuditoriasReporteResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        usuariosXRole("", token)
            .then((resp: any) => {
                const list = Array.isArray(resp?.users) ? resp.users : []
                setOperadores([...list].sort((a: Usuario, b: Usuario) => `${a.apellido ?? ""} ${a.nombre ?? ""}`.trim().toLowerCase().localeCompare(`${b.apellido ?? ""} ${b.nombre ?? ""}`.trim().toLowerCase())))
            })
            .catch(() => setOperadores([]))
    }, [token])

    useEffect(() => {
        if (!token) return
        const controller = new AbortController()
        setLoading(true)
        setError(null)
        getAuditoriasReporte(token, { desde: desde || undefined, hasta: hasta || undefined, operatorId: operatorId || undefined }, { signal: controller.signal })
            .then((resp: any) => {
                const reason = getAuthSessionReason(resp)
                if (reason) { dispatch(openSessionExpired(reason)); return }
                if ((resp?.statusCode ?? 200) >= 400 || !resp?.area) { setError("No se pudo cargar el reporte."); return }
                setData(resp)
            })
            .catch((err: any) => {
                if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return
                setError("No se pudo cargar el reporte.")
            })
            .finally(() => setLoading(false))
        return () => controller.abort()
    }, [token, desde, hasta, operatorId, dispatch])

    if (!esAuditor) return <Navigate to="/dashboard/conversaciones" replace />

    const area = data?.area ?? { total: 0, VERDE: 0, AMARILLO: 0, ROJO: 0 }
    const criteriosConFallas = (data?.criterios ?? []).filter((c) => c.ROJO > 0 || c.AMARILLO > 0)

    return (
        <div className="chats-container">
            <div className="main-chat">
                <ConversacionesTabs activa="reporte" />
                <div className="rep-main">
                    <div className="rep-filtros">
                        <div className="filter-input-row">
                            <Calendar className="filter-input-icon" size={16} />
                            <input type="date" className="filter-select" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} title="Desde (fecha de cierre)" />
                        </div>
                        <div className="filter-input-row">
                            <Calendar className="filter-input-icon" size={16} />
                            <input type="date" className="filter-select" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} title="Hasta (fecha de cierre)" />
                        </div>
                        <div className="conv-filtros-rapidos">
                            <button type="button" className={`conv-chip ${desde === hoy() && hasta === hoy() ? 'conv-chip--on' : ''}`} onClick={() => { setDesde(hoy()); setHasta(hoy()) }}>Hoy</button>
                            <button type="button" className={`conv-chip ${desde === haceDias(7) && hasta === hoy() ? 'conv-chip--on' : ''}`} onClick={() => { setDesde(haceDias(7)); setHasta(hoy()) }}>7 días</button>
                            <button type="button" className={`conv-chip ${desde === haceDias(30) && hasta === hoy() ? 'conv-chip--on' : ''}`} onClick={() => { setDesde(haceDias(30)); setHasta(hoy()) }}>30 días</button>
                        </div>
                        <div className="filter-input-row">
                            <User className="filter-input-icon" size={18} />
                            <select className={`filter-select ${operatorId === "" ? "filter-select--placeholder" : ""}`} value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
                                <option value="">Todas las operadoras</option>
                                <option value="SISTEMA">Sistema</option>
                                {operadores.map((op) => (
                                    <option key={op.id} value={op.id}>{op.apellido} {op.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <div className="chat-loader-center"><div className="loader2"></div></div>
                    )}
                    {!loading && error && (
                        <div className="chat-filter-empty-state"><p className="chat-filter-empty-title">{error}</p></div>
                    )}
                    {!loading && !error && area.total === 0 && (
                        <div className="chat-filter-empty-state">
                            <p className="chat-filter-empty-title">No hay auditorías para este rango</p>
                            <p className="auditoria-meta">El rango es por fecha de cierre de la conversación.</p>
                        </div>
                    )}

                    {!loading && !error && area.total > 0 && (
                        <>
                            <div className="rep-tarjetas">
                                <div className="rep-tarjeta rep-tarjeta--total">
                                    <span className="rep-tarjeta-n">{area.total}</span>
                                    <span className="rep-tarjeta-l">Auditadas</span>
                                </div>
                                <div className="rep-tarjeta rep-tarjeta--verde">
                                    <span className="rep-tarjeta-n">{pct(area.VERDE, area.total)}%</span>
                                    <span className="rep-tarjeta-l">Verde · {area.VERDE}</span>
                                </div>
                                <div className="rep-tarjeta rep-tarjeta--amarillo">
                                    <span className="rep-tarjeta-n">{pct(area.AMARILLO, area.total)}%</span>
                                    <span className="rep-tarjeta-l">Amarillo · {area.AMARILLO}</span>
                                </div>
                                <div className="rep-tarjeta rep-tarjeta--rojo">
                                    <span className="rep-tarjeta-n">{pct(area.ROJO, area.total)}%</span>
                                    <span className="rep-tarjeta-l">Rojo · {area.ROJO}</span>
                                </div>
                            </div>

                            <div className="rep-seccion">
                                <div className="rep-seccion-titulo">Por operadora</div>
                                <table className="rep-tabla">
                                    <thead>
                                        <tr>
                                            <th>Operadora</th>
                                            <th className="rep-num">Auditadas</th>
                                            <th className="rep-num rep-verde">Verde</th>
                                            <th className="rep-num rep-amarillo">Amarillo</th>
                                            <th className="rep-num rep-rojo">Rojo</th>
                                            <th className="rep-barra-col">Distribución</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.operadoras ?? []).map((o) => {
                                            const key = o.operatorId ?? 'SISTEMA'
                                            const label = o.operatorId ? [capitalizeText(o.nombre), capitalizeText(o.apellido)].filter(Boolean).join(' ') || 'Operadora' : 'Sistema'
                                            return (
                                                <tr key={key}>
                                                    <td>
                                                        <Link to={`/dashboard/conversaciones?operatorId=${key}&auditada=si&desde=${desde}&hasta=${hasta}`} className="rep-link" title="Ver las conversaciones auditadas de esta operadora">{label}</Link>
                                                    </td>
                                                    <td className="rep-num">{o.total}</td>
                                                    <td className="rep-num rep-verde">{o.VERDE} <small>({pct(o.VERDE, o.total)}%)</small></td>
                                                    <td className="rep-num rep-amarillo">{o.AMARILLO} <small>({pct(o.AMARILLO, o.total)}%)</small></td>
                                                    <td className="rep-num rep-rojo">{o.ROJO} <small>({pct(o.ROJO, o.total)}%)</small></td>
                                                    <td className="rep-barra-col"><Barra verde={o.VERDE} amarillo={o.AMARILLO} rojo={o.ROJO} /></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="rep-seccion">
                                <div className="rep-seccion-titulo">Criterios que más fallan</div>
                                {criteriosConFallas.length === 0 ? (
                                    <p className="auditoria-meta">Ningún criterio tuvo rojo ni amarillo en este rango.</p>
                                ) : (
                                    <table className="rep-tabla">
                                        <thead>
                                            <tr>
                                                <th>Criterio</th>
                                                <th className="rep-num">Evaluado</th>
                                                <th className="rep-num rep-rojo">Rojo</th>
                                                <th className="rep-num rep-amarillo">Amarillo</th>
                                                <th className="rep-barra-col">Distribución</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {criteriosConFallas.map((c) => (
                                                <tr key={c.codigo}>
                                                    <td title={c.grupo}>{c.numero}. {c.titulo}</td>
                                                    <td className="rep-num">{c.evaluadas}</td>
                                                    <td className="rep-num rep-rojo">{c.ROJO} <small>({pct(c.ROJO, c.evaluadas)}%)</small></td>
                                                    <td className="rep-num rep-amarillo">{c.AMARILLO} <small>({pct(c.AMARILLO, c.evaluadas)}%)</small></td>
                                                    <td className="rep-barra-col"><Barra verde={c.VERDE} amarillo={c.AMARILLO} rojo={c.ROJO} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ReporteAuditorias
