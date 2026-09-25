// src/pages/estudios-bot/EstudiosBot.tsx
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaSearch, FaSync, FaTimesCircle, FaCheck } from "react-icons/fa"
import { listarEstudios } from "../../services/estudios-bot/estudiosBot.api"
import { EstudioListaItem, Veredicto } from "../../interfaces/estudios-bot.interface"
import './estudios-bot.css'

export const VEREDICTO_CFG: Record<Veredicto, { label: string; cls: string }> = {
  CODIFICAR: { label: 'Codifica', cls: 'eb-badge-verde' },
  RECHAZAR: { label: 'Rechaza', cls: 'eb-badge-rojo' },
  DERIVAR: { label: 'Deriva', cls: 'eb-badge-amarillo' },
}

export const formatFecha = (s: string | null | undefined) => {
  if (!s) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(s))
}

const EstudiosBot = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState<EstudioListaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [veredicto, setVeredicto] = useState('')
  const [revision, setRevision] = useState<'' | 'pendiente' | 'completa'>('')
  const [incluirPruebas, setIncluirPruebas] = useState(false)

  const cargar = useCallback(async (p = 1) => {
    setCargando(true)
    setError(null)
    try {
      const r = await listarEstudios({ page: p, limit, q, veredicto, revision, incluirPruebas })
      if (!Array.isArray(r.items)) throw new Error(r.message ?? 'No se pudo obtener el listado')
      setItems(r.items)
      setTotal(r.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión')
    } finally {
      setCargando(false)
    }
  }, [q, veredicto, revision, incluirPruebas, limit])

  useEffect(() => { cargar(1) }, [veredicto, revision, incluirPruebas]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="eb-wrapper">
      <div className="eb-header">
        <h2 className="eb-header-title">Estudios médicos analizados por el bot</h2>
        <p className="eb-header-description">
          Cada pedido que el bot analizó en sombra. Abrí uno, completá el formulario como en Expendio y guardá:
          recién ahí se muestra lo que hubiera hecho el bot.
        </p>
      </div>

      <div className="eb-container">
        <div className="eb-filters">
          <div className="eb-filter-group">
            <label className="eb-filter-label"><FaSearch className="eb-filter-icon" /> Afiliado, DNI, N° afiliado o prestador</label>
            <input
              className="eb-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargar(1)}
              placeholder="Buscar..."
            />
          </div>
          <div className="eb-filter-group eb-filter-sm">
            <label className="eb-filter-label">Bot</label>
            <select className="eb-input" value={veredicto} onChange={(e) => setVeredicto(e.target.value)}>
              <option value="">Todos</option>
              <option value="CODIFICAR">Codifica</option>
              <option value="RECHAZAR">Rechaza</option>
              <option value="DERIVAR">Deriva</option>
            </select>
          </div>
          <div className="eb-filter-group eb-filter-sm">
            <label className="eb-filter-label">Revisión</label>
            <select className="eb-input" value={revision} onChange={(e) => setRevision(e.target.value as any)}>
              <option value="">Todas</option>
              <option value="pendiente">Sin revisar</option>
              <option value="completa">Revisadas</option>
            </select>
          </div>
          <div className="eb-filter-group eb-filter-sm">
            <label className="eb-filter-label eb-check">
              <input type="checkbox" checked={incluirPruebas} onChange={(e) => setIncluirPruebas(e.target.checked)} />
              Incluir pruebas
            </label>
          </div>
          <div className="eb-filter-actions">
            <button className="eb-btn-primary" onClick={() => cargar(page)} disabled={cargando}>
              <FaSync className={cargando ? 'spinning' : ''} /> {cargando ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="eb-error-banner"><FaTimesCircle /> <span>{error}</span></div>
        )}

        <div className="eb-table-wrapper">
          <table className="eb-table">
            <thead className="eb-table-header">
              <tr>
                <th className="eb-th">Fecha</th>
                <th className="eb-th">N° Afiliado</th>
                <th className="eb-th">Afiliado</th>
                <th className="eb-th">Provincia</th>
                <th className="eb-th">Prestador</th>
                <th className="eb-th">Bot</th>
                <th className="eb-th">Motivo</th>
                <th className="eb-th eb-th-center">Revisión</th>
              </tr>
            </thead>
            <tbody>
              {!cargando && items.length === 0 && (
                <tr><td colSpan={8} className="eb-empty">No hay estudios para mostrar</td></tr>
              )}
              {items.map((it) => {
                const cfg = VEREDICTO_CFG[it.bot_veredicto] ?? { label: it.bot_veredicto, cls: '' }
                return (
                  <tr
                    key={it.id}
                    className={`eb-row eb-row-${it.bot_veredicto.toLowerCase()}`}
                    onClick={() => navigate(`/dashboard/estudios-bot/${it.id}`)}
                  >
                    <td className="eb-td eb-td-fecha">{formatFecha(it.created_at)}</td>
                    <td className="eb-td eb-td-mono">{it.nro_afiliado ?? it.dni ?? '—'}</td>
                    <td className="eb-td">
                      <span className="eb-afiliado">{it.afiliado_nombre ?? '—'}</span>
                      {it.es_prueba && <span className="eb-tag-prueba">PRUEBA</span>}
                    </td>
                    <td className="eb-td">{it.provincia ?? '—'}</td>
                    <td className="eb-td eb-td-prestador" title={it.bot_prestador_nombre ?? ''}>{it.bot_prestador_nombre ?? '—'}</td>
                    <td className="eb-td"><span className={`eb-badge ${cfg.cls}`}>{cfg.label}</span></td>
                    <td className="eb-td eb-td-motivo">{it.bot_veredicto === 'CODIFICAR' ? '' : (it.bot_motivo ?? '—')}</td>
                    <td className="eb-td eb-td-center">
                      {it.op_fecha
                        ? <span className="eb-revisada" title={`${it.op_usuario_nombre ?? ''} · ${formatFecha(it.op_fecha)}`}><FaCheck /> {it.op_usuario_nombre?.split(' ')[0] ?? 'Sí'}</span>
                        : <span className="eb-pendiente">Pendiente</span>}
                    </td>
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

export default EstudiosBot
