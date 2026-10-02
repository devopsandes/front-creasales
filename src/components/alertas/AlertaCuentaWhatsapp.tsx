import { useEffect, useRef, useState } from 'react'

type AlertaCuenta = {
    id: string
    code: number
    motivo: string
    titulo?: string
    linea?: string
    detectadoEn: string
}

const INTERVALO_CONSULTA_MS = 10 * 60 * 1000 // 10 minutos
const CLAVE_CERRADA = 'alertaCuentaWhatsappCerrada'

export default function AlertaCuentaWhatsapp({
    consultar,
}: {
    consultar: () => Promise<{ alerta: AlertaCuenta | null }>
}) {
    const [alerta, setAlerta] = useState<AlertaCuenta | null>(null)
    const consultarRef = useRef(consultar)
    consultarRef.current = consultar

    useEffect(() => {
        let activo = true

        const revisar = async () => {
            try {
                const resp = await consultarRef.current()
                const nueva = resp?.alerta ?? null
                if (!activo) return
                if (!nueva) { setAlerta(null); return }
                const cerrada = sessionStorage.getItem(CLAVE_CERRADA)
                if (cerrada !== nueva.id) setAlerta(nueva)
            } catch {
                // Si falla la consulta, no se muestra nada; se reintenta en el próximo ciclo.
            }
        }

        revisar()
        const intervalo = setInterval(revisar, INTERVALO_CONSULTA_MS)
        return () => { activo = false; clearInterval(intervalo) }
    }, [])

    const cerrar = () => {
        if (alerta) sessionStorage.setItem(CLAVE_CERRADA, alerta.id)
        setAlerta(null)
    }

    useEffect(() => {
        if (!alerta) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [alerta])

    if (!alerta) return null

    const hora = new Date(alerta.detectadoEn).toLocaleString('es-AR')

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
            }}
            onClick={cerrar}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative', maxWidth: 520, width: '100%',
                    background: '#dc2626', color: '#fff',
                    borderRadius: 12, padding: '28px 28px 24px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                    fontFamily: 'inherit',
                }}
            >
                <button
                    onClick={cerrar}
                    aria-label="Cerrar"
                    style={{
                        position: 'absolute', top: 10, right: 14,
                        background: 'transparent', border: 'none',
                        color: '#fff', fontSize: 26, lineHeight: 1, cursor: 'pointer',
                    }}
                >
                    ×
                </button>

                <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700 }}>
                    ⚠️ WhatsApp no está enviando mensajes
                </h2>
                <p style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600 }}>
                    Motivo: {alerta.motivo}
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 15 }}>
                    Los afiliados <b>NO</b> están recibiendo las respuestas del bot ni de las operadoras.
                </p>
                <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>
                    Avisá a tu supervisor o a sistemas de inmediato.
                </p>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
                    Línea: {alerta.linea ?? '—'} · Código Meta: {alerta.code} · Detectado: {hora}
                </p>
            </div>
        </div>
    )
}