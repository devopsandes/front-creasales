// src/pages/estudios-bot/LupaSelector.tsx
import { useEffect, useRef, useState } from "react"
import { FaSearch, FaTimes } from "react-icons/fa"

export interface LupaItem {
  id: string
  titulo: string
  subtitulo?: string
}

type Props<T> = {
  label: string
  /** Lo que se muestra en el input. */
  valor: string
  placeholder?: string
  disabled?: boolean
  /** Busca en el catálogo. Se llama con debounce a medida que se escribe. */
  buscar: (q: string) => Promise<T[]>
  /** Cómo mostrar cada resultado. */
  mapear: (item: T) => LupaItem
  onSeleccionar: (item: T) => void
  onLimpiar?: () => void
  /** Texto de ayuda debajo del input. */
  hint?: string
}

const LupaSelector = <T,>({ label, valor, placeholder, disabled, buscar, mapear, onSeleccionar, onLimpiar, hint }: Props<T>) => {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<T[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!abierto) return
    setQ('')
    setResultados([])
    setError(null)
    ejecutar('')
    setTimeout(() => inputRef.current?.focus(), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const ejecutar = async (texto: string) => {
    setCargando(true)
    setError(null)
    try {
      const r = await buscar(texto)
      setResultados(Array.isArray(r) ? r : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar')
      setResultados([])
    } finally {
      setCargando(false)
    }
  }

  const onChange = (texto: string) => {
    setQ(texto)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => ejecutar(texto), 350)
  }

  const elegir = (item: T) => {
    onSeleccionar(item)
    setAbierto(false)
  }

  return (
    <div className="eb-lupa">
      <label className="eb-label">{label}</label>
      <div className="eb-lupa-row">
        <input
          type="text"
          className="eb-input eb-lupa-input"
          value={valor}
          placeholder={placeholder ?? 'Sin seleccionar'}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setAbierto(true)}
          title={valor}
        />
        {valor && onLimpiar && !disabled && (
          <button type="button" className="eb-lupa-clear" onClick={onLimpiar} title="Limpiar"><FaTimes /></button>
        )}
        <button type="button" className="eb-lupa-btn" onClick={() => setAbierto(true)} disabled={disabled} title="Buscar">
          <FaSearch />
        </button>
      </div>
      {hint && <span className="eb-hint">{hint}</span>}

      {abierto && (
        <div className="eb-modal-overlay" onClick={() => setAbierto(false)}>
          <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eb-modal-header">
              <h3 className="eb-modal-title">{label}</h3>
              <input
                ref={inputRef}
                type="text"
                className="eb-input eb-modal-search"
                placeholder="Escribí para buscar..."
                value={q}
                onChange={(e) => onChange(e.target.value)}
              />
              <button type="button" className="eb-modal-close" onClick={() => setAbierto(false)}><FaTimes /></button>
            </div>
            <div className="eb-modal-body">
              {cargando && <div className="eb-modal-info">Buscando...</div>}
              {error && <div className="eb-modal-info eb-modal-error">{error}</div>}
              {!cargando && !error && resultados.length === 0 && (
                <div className="eb-modal-info">Sin resultados</div>
              )}
              {!cargando && resultados.map((item, i) => {
                const m = mapear(item)
                return (
                  <button type="button" key={`${m.id}-${i}`} className="eb-modal-item" onClick={() => elegir(item)}>
                    <span className="eb-modal-item-titulo">{m.titulo}</span>
                    {m.subtitulo && <span className="eb-modal-item-sub">{m.subtitulo}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LupaSelector
