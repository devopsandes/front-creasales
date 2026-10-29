import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaPlus, FaSync, FaTimesCircle } from "react-icons/fa"
import { listarTicketsSoporte } from "../../services/soporte/soporte.services"
import { ESTADOS_SOPORTE, GRAVEDADES_SOPORTE, TicketSoporte } from "../../interfaces/soporte.interface"
import '../estudios-bot/estudios-bot.css'
import './soporte.css'

export const formatFechaSoporte = (s: string | null | undefined) => {
    if (!s) return '—'
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(s))
}

export const esAdminSoporte = () => {
    const role = localStorage.getItem('role')
    return role === 'ROOT' || role === 'ADMIN'
}

const MesaAyuda = () => {
    const navigate = useNavigate()
    const admin = esAdminSoporte()
    const [tickets, setTickets] = useState<TicketSoporte[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [limit] = useState(20)
    const [estado, setEstado] = useState('')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const cargar = useCallback(async (p = 1) => {
        setCargando(true)
        setError(null)
        try {
            const r = await listarTicketsSoporte({ page: p, limit, estado: estado || undefined })
            if (!Array.isArray(r.tickets)) throw new Error(Array.isArray(r.message) ? r.message.join(', ') : (r.message ?? 'No se pudo obtener el listado'))
            setTickets(r.tickets)
            setTotal(r.total ?? 0)
            setPage(p)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setCargando(false)
        }
    }, [estado, limit])

    useEffect(() => { cargar(1) }, [estado]) // eslint-disable-line react-hooks/exhaustive-deps

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return (
        <div className="eb-wrapper">
            <div className="eb-header">
                <div className="sp-header-row">
                    <div>
                        <h2 className="eb-header-title">Mesa de ayuda</h2>
                        <p className="eb-header-description">
                            ¿Algo de CreaSales no funciona o no sabés cómo hacer algo? Cargá un ticket y le llega al equipo de soporte de Createch.
                            Sus respuestas aparecen acá mismo, dentro del ticket.
                        </p>
                    </div>
                    <button className="eb-btn-primary" onClick={() => navigate('/dashboard/soporte/nuevo')}>
                        <FaPlus /> Nuevo ticket
                    </button>
                </div>
            </div>

            <div className="eb-container">
                <div className="eb-filters">
                    <div className="eb-filter-group eb-filter-sm">
                        <label className="eb-filter-label">Estado</label>
                        <select className="eb-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                            <option value="">Todos</option>
                            {Object.entries(ESTADOS_SOPORTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div className="eb-filter-actions">
                        <button className="eb-btn-secondary" onClick={() => cargar(page)} disabled={cargando}>
                            <FaSync className={cargando ? 'spinning' : ''} /> {cargando ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                {error && <div className="eb-error-banner"><FaTimesCircle /> <span>{error}</span></div>}

                <div className="eb-table-wrapper">
                    <table className="eb-table">
                        <thead className="eb-table-header">
                            <tr>
                                <th className="eb-th">Número</th>
                                <th className="eb-th">Título</th>
                                <th className="eb-th">Categoría</th>
                                <th className="eb-th">Gravedad</th>
                                <th className="eb-th">Estado</th>
                                {admin && <th className="eb-th">Autor</th>}
                                <th className="eb-th">Actualizado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!cargando && tickets.length === 0 && (
                                <tr><td colSpan={admin ? 7 : 6} className="eb-empty">
                                    {estado ? 'No hay tickets en este estado' : 'Todavía no cargaste ningún ticket'}
                                </td></tr>
                            )}
                            {tickets.map((t) => {
                                const est = ESTADOS_SOPORTE[t.estado] ?? { label: t.estado, cls: '' }
                                const grav = GRAVEDADES_SOPORTE.find((g) => g.valor === t.gravedad)
                                const rowCls = t.estado === 'esperando-cliente' ? 'sp-row-esperando' : t.estado === 'cerrado' ? 'sp-row-cerrado' : ''
                                return (
                                    <tr key={t.id} className={`eb-row ${rowCls}`} onClick={() => navigate(`/dashboard/soporte/${t.id}`)}>
                                        <td className="eb-td eb-td-mono">
                                            {t.numero}
                                            {t.referenciaExterna && <span className="eb-hint" style={{ margin: 0 }}>{t.referenciaExterna}</span>}
                                        </td>
                                        <td className="eb-td eb-td-prestador" title={t.titulo ?? ''}><span className="eb-afiliado">{t.titulo ?? '(sin título)'}</span></td>
                                        <td className="eb-td">{t.categoriaNombre ?? '—'}</td>
                                        <td className="eb-td">{grav ? <span className={`eb-badge ${grav.cls}`}>{grav.label}</span> : '—'}</td>
                                        <td className="eb-td"><span className={`eb-badge ${est.cls}`}>{est.label}</span></td>
                                        {admin && <td className="eb-td">{t.autorNombre ?? '—'}</td>}
                                        <td className="eb-td eb-td-fecha">{formatFechaSoporte(t.updatedAt)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="eb-pagination">
                    <div className="eb-total">Total: <b>{total}</b></div>
                    <div className="eb-pagination-right">
                        <button className="eb-btn-page" disabled={page <= 1 || cargando} onClick={() => cargar(page - 1)}>Anterior</button>
                        <span className="eb-page-info">{page} / {totalPages}</span>
                        <button className="eb-btn-page" disabled={page >= totalPages || cargando} onClick={() => cargar(page + 1)}>Siguiente</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MesaAyuda