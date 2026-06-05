import { useState, useEffect, useRef } from 'react'
import { Bot, Save, RefreshCw, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import './BotConfig.css'

// ─── Tipos ───────────────────────────────────────────────
interface BotConfigData {
  prompt: string
  tools: string
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

// ─── URL del backend conversacional ──────────────────────
// Ajustá esto según tu .env del frontend
const CONV_API_URL = import.meta.env.VITE_CONV_API_URL || 'https://sales.createch.com.ar'

// ─── Helpers ─────────────────────────────────────────────
const isValidJson = (str: string): boolean => {
  if (!str.trim()) return true
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed)
  } catch {
    return false
  }
}

const getJsonError = (str: string): string | null => {
  if (!str.trim()) return null
  try {
    const parsed = JSON.parse(str)
    if (!Array.isArray(parsed)) return 'El JSON debe ser un array de tool definitions'
    return null
  } catch (e: any) {
    return e.message || 'JSON inválido'
  }
}

// ─── Componente principal ─────────────────────────────────
const BotConfig = () => {
  const token = localStorage.getItem('token') || ''

  const [prompt, setPrompt] = useState<string>('')
  const [tools, setTools] = useState<string>('')
  const [originalPrompt, setOriginalPrompt] = useState<string>('')
  const [originalTools, setOriginalTools] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [promptSaveStatus, setPromptSaveStatus] = useState<SaveStatus>('idle')
  const [toolsSaveStatus, setToolsSaveStatus] = useState<SaveStatus>('idle')
  const [promptSaveMsg, setPromptSaveMsg] = useState<string>('')
  const [toolsSaveMsg, setToolsSaveMsg] = useState<string>('')

  const [jsonError, setJsonError] = useState<string | null>(null)
  const [jsonToolCount, setJsonToolCount] = useState<number | null>(null)

  const [promptExpanded, setPromptExpanded] = useState<boolean>(true)
  const [toolsExpanded, setToolsExpanded] = useState<boolean>(true)

  const promptRef = useRef<HTMLTextAreaElement>(null)
  const toolsRef = useRef<HTMLTextAreaElement>(null)

  // ─── Fetch inicial ────────────────────────────────────
  const fetchConfig = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`${CONV_API_URL}/api/v1/bot-config`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const data: BotConfigData = await res.json()
      setPrompt(data.prompt || '')
      setTools(data.tools || '')
      setOriginalPrompt(data.prompt || '')
      setOriginalTools(data.tools || '')
      // Contar tools
      try {
        const parsed = JSON.parse(data.tools || '[]')
        if (Array.isArray(parsed)) setJsonToolCount(parsed.length)
      } catch {
        setJsonToolCount(null)
      }
    } catch (e: any) {
      setLoadError(e.message || 'No se pudo cargar la configuración del bot')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Validación JSON al editar ────────────────────────
  const handleToolsChange = (value: string) => {
    setTools(value)
    const err = getJsonError(value)
    setJsonError(err)
    if (!err) {
      try {
        const parsed = JSON.parse(value || '[]')
        if (Array.isArray(parsed)) setJsonToolCount(parsed.length)
      } catch {
        setJsonToolCount(null)
      }
    } else {
      setJsonToolCount(null)
    }
  }

  // ─── Auto-resize textareas ────────────────────────────
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = 'auto'
      promptRef.current.style.height = Math.min(promptRef.current.scrollHeight, 600) + 'px'
    }
  }, [prompt])

  useEffect(() => {
    if (toolsRef.current) {
      toolsRef.current.style.height = 'auto'
      toolsRef.current.style.height = Math.min(toolsRef.current.scrollHeight, 600) + 'px'
    }
  }, [tools])

  // ─── Formatear JSON ───────────────────────────────────
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(tools)
      setTools(JSON.stringify(parsed, null, 2))
      setJsonError(null)
    } catch {
      // ya hay error visible
    }
  }

  // ─── Guardar prompt ───────────────────────────────────
  const handleSavePrompt = async () => {
    if (promptSaveStatus === 'saving') return
    setPromptSaveStatus('saving')
    setPromptSaveMsg('')
    try {
      const res = await fetch(`${CONV_API_URL}/api/v1/bot-config/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `Error ${res.status}`)
      }
      setOriginalPrompt(prompt)
      setPromptSaveStatus('success')
      setPromptSaveMsg('System prompt guardado correctamente')
    } catch (e: any) {
      setPromptSaveStatus('error')
      setPromptSaveMsg(e.message || 'No se pudo guardar el prompt')
    } finally {
      setTimeout(() => {
        setPromptSaveStatus('idle')
        setPromptSaveMsg('')
      }, 3500)
    }
  }

  // ─── Guardar tools ────────────────────────────────────
  const handleSaveTools = async () => {
    if (toolsSaveStatus === 'saving') return
    if (!isValidJson(tools)) return
    setToolsSaveStatus('saving')
    setToolsSaveMsg('')
    try {
      const res = await fetch(`${CONV_API_URL}/api/v1/bot-config/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tools }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `Error ${res.status}`)
      }
      setOriginalTools(tools)
      setToolsSaveStatus('success')
      setToolsSaveMsg('Tools guardadas correctamente')
    } catch (e: any) {
      setToolsSaveStatus('error')
      setToolsSaveMsg(e.message || 'No se pudo guardar las tools')
    } finally {
      setTimeout(() => {
        setToolsSaveStatus('idle')
        setToolsSaveMsg('')
      }, 3500)
    }
  }

  const promptDirty = prompt !== originalPrompt
  const toolsDirty = tools !== originalTools

  // ─── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="botconfig-wrapper">
        <div className="botconfig-loader">
          <div className="loader2" />
          <p className="botconfig-loader-text">Cargando configuración de Pixi...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="botconfig-wrapper">
        <div className="botconfig-load-error">
          <XCircle size={32} className="botconfig-error-icon" />
          <p className="botconfig-error-title">No se pudo cargar la configuración</p>
          <p className="botconfig-error-msg">{loadError}</p>
          <button className="botconfig-btn-retry" onClick={fetchConfig}>
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="botconfig-wrapper">
      {/* ── Header ── */}
      <div className="botconfig-header">
        <div className="botconfig-header-left">
          <div className="botconfig-header-icon">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="botconfig-header-title">Configuración de Pixi</h2>
            <p className="botconfig-header-sub">Editá el system prompt y las tool definitions del bot de WhatsApp</p>
          </div>
        </div>
        <button className="botconfig-btn-reload" onClick={fetchConfig} title="Recargar desde el servidor">
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      <div className="botconfig-body">
        {/* ── Sección System Prompt ── */}
        <div className="botconfig-section">
          <div className="botconfig-section-header" onClick={() => setPromptExpanded(v => !v)}>
            <div className="botconfig-section-title-row">
              <span className="botconfig-section-title">System Prompt</span>
              {promptDirty && <span className="botconfig-dirty-badge">Sin guardar</span>}
              <span className="botconfig-char-count">{prompt.length} caracteres</span>
            </div>
            {promptExpanded ? <ChevronUp size={16} className="botconfig-chevron" /> : <ChevronDown size={16} className="botconfig-chevron" />}
          </div>

          {promptExpanded && (
            <div className="botconfig-section-body">
              <p className="botconfig-section-hint">
                Este texto define el comportamiento, personalidad y contexto de Pixi. Es el primer mensaje que recibe el modelo en cada conversación.
              </p>
              <textarea
                ref={promptRef}
                className="botconfig-textarea botconfig-textarea--prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Escribí el system prompt de Pixi..."
                spellCheck={false}
              />
              <div className="botconfig-section-footer">
                {promptSaveStatus === 'success' && (
                  <div className="botconfig-feedback botconfig-feedback--success">
                    <CheckCircle size={15} />
                    {promptSaveMsg}
                  </div>
                )}
                {promptSaveStatus === 'error' && (
                  <div className="botconfig-feedback botconfig-feedback--error">
                    <XCircle size={15} />
                    {promptSaveMsg}
                  </div>
                )}
                <button
                  className={`botconfig-btn-save ${promptSaveStatus === 'saving' ? 'botconfig-btn-save--loading' : ''} ${!promptDirty ? 'botconfig-btn-save--disabled' : ''}`}
                  onClick={handleSavePrompt}
                  disabled={!promptDirty || promptSaveStatus === 'saving'}
                >
                  {promptSaveStatus === 'saving' ? (
                    <><RefreshCw size={15} className="botconfig-spin" /> Guardando...</>
                  ) : (
                    <><Save size={15} /> Guardar prompt</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sección Tools ── */}
        <div className="botconfig-section">
          <div className="botconfig-section-header" onClick={() => setToolsExpanded(v => !v)}>
            <div className="botconfig-section-title-row">
              <span className="botconfig-section-title">Tool Definitions</span>
              {toolsDirty && <span className="botconfig-dirty-badge">Sin guardar</span>}
              {jsonToolCount !== null && (
                <span className="botconfig-tool-count">{jsonToolCount} {jsonToolCount === 1 ? 'tool' : 'tools'}</span>
              )}
              {jsonError && (
                <span className="botconfig-json-error-badge">
                  <AlertTriangle size={12} /> JSON inválido
                </span>
              )}
            </div>
            {toolsExpanded ? <ChevronUp size={16} className="botconfig-chevron" /> : <ChevronDown size={16} className="botconfig-chevron" />}
          </div>

          {toolsExpanded && (
            <div className="botconfig-section-body">
              <p className="botconfig-section-hint">
                Array de tool definitions en formato OpenAI Responses API. Cada objeto define una función que el bot puede invocar.
              </p>
              {jsonError && (
                <div className="botconfig-json-error-inline">
                  <AlertTriangle size={14} />
                  <span>{jsonError}</span>
                </div>
              )}
              <div className="botconfig-textarea-wrapper">
                <textarea
                  ref={toolsRef}
                  className={`botconfig-textarea botconfig-textarea--json ${jsonError ? 'botconfig-textarea--error' : ''}`}
                  value={tools}
                  onChange={e => handleToolsChange(e.target.value)}
                  placeholder='[\n  {\n    "type": "function",\n    "name": "...",\n    ...\n  }\n]'
                  spellCheck={false}
                />
              </div>
              <div className="botconfig-section-footer">
                {toolsSaveStatus === 'success' && (
                  <div className="botconfig-feedback botconfig-feedback--success">
                    <CheckCircle size={15} />
                    {toolsSaveMsg}
                  </div>
                )}
                {toolsSaveStatus === 'error' && (
                  <div className="botconfig-feedback botconfig-feedback--error">
                    <XCircle size={15} />
                    {toolsSaveMsg}
                  </div>
                )}
                <div className="botconfig-footer-actions">
                  <button
                    className="botconfig-btn-format"
                    onClick={handleFormatJson}
                    disabled={!!jsonError || !tools.trim()}
                    title="Formatear JSON con indentación"
                  >
                    Formatear JSON
                  </button>
                  <button
                    className={`botconfig-btn-save ${toolsSaveStatus === 'saving' ? 'botconfig-btn-save--loading' : ''} ${(!toolsDirty || !!jsonError) ? 'botconfig-btn-save--disabled' : ''}`}
                    onClick={handleSaveTools}
                    disabled={!toolsDirty || !!jsonError || toolsSaveStatus === 'saving'}
                  >
                    {toolsSaveStatus === 'saving' ? (
                      <><RefreshCw size={15} className="botconfig-spin" /> Guardando...</>
                    ) : (
                      <><Save size={15} /> Guardar tools</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BotConfig
