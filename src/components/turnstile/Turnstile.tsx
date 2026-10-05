import { useEffect, useRef } from 'react'

declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, opciones: Record<string, unknown>) => string
            remove: (widgetId: string) => void
        }
    }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || ''

let cargaScript: Promise<void> | null = null

// El script se carga solo en la pantalla de login, una vez.
const cargarScript = (): Promise<void> => {
    if (window.turnstile) return Promise.resolve()
    if (cargaScript) return cargaScript

    cargaScript = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = SCRIPT_URL
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => {
            cargaScript = null
            reject(new Error('No se pudo cargar Cloudflare Turnstile'))
        }
        document.head.appendChild(script)
    })

    return cargaScript
}

type Props = {
    onToken: (token: string) => void
    onError?: () => void
}

/**
 * Control de Cloudflare Turnstile. Sin VITE_TURNSTILE_SITE_KEY no muestra
 * nada. El comprobante es de un solo uso: cada vez que el componente se
 * vuelve a montar, genera uno nuevo.
 */
const Turnstile = ({ onToken, onError }: Props) => {
    const contenedor = useRef<HTMLDivElement>(null)
    const callbacks = useRef({ onToken, onError })
    callbacks.current = { onToken, onError }

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) return

        let widgetId: string | null = null
        let desmontado = false

        cargarScript()
            .then(() => {
                if (desmontado || !contenedor.current || !window.turnstile) return
                widgetId = window.turnstile.render(contenedor.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    language: 'es',
                    theme: 'dark',
                    callback: (token: string) => callbacks.current.onToken(token),
                    'expired-callback': () => callbacks.current.onToken(''),
                    'error-callback': () => {
                        callbacks.current.onToken('')
                        callbacks.current.onError?.()
                    },
                })
            })
            .catch(() => callbacks.current.onError?.())

        return () => {
            desmontado = true
            if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
        }
    }, [])

    if (!TURNSTILE_SITE_KEY) return null

    return <div ref={contenedor} className="signin-turnstile" />
}

export default Turnstile