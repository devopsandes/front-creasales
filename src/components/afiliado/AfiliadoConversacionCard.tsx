// src/components/afiliado/AfiliadoConversacionCard.tsx
// Tarjeta "Datos del afiliado" de UNA conversación: quién se identificó en
// ella, con los datos en vivo desde Andes (o del servicio por celular si no
// hubo DNI). Es la misma información que el panel derecho de la pantalla de
// chats; acá se usa en el detalle de conversaciones archivadas.
import { useEffect, useMemo, useState } from "react"
import { getAfiliadoConversacion, AfiliadoConversacionResponse } from "../../services/chats/chats.services"

/** Andes → nombres de campo del panel (mismo mapeo que en la pantalla de chats). */
export const mapAfiliadoAndes = (a: any) => {
    if (!a) return null
    const nombreCompleto = `${a.apellido ?? ''} ${a.nombre ?? ''}`.trim()
    return {
        apellidoNombre: a.apellNomb ?? (nombreCompleto || null),
        mail: a.mail ?? null,
        celular: a.numCelular ?? null,
        planAfiliado: a.planPrestacional ?? null,
        provinciaDom: a.provincia ?? null,
        viasClinicas: a.viasClinicas ?? null,
        cuilAfiliado: a.cuil ?? null,
        CUILTitular: a.cuilTitular ?? null,
        IdAfiliadoTitular: a.idAfiliadoTitular ?? null,
        mesAlta: a.perAltaGuion ?? a.perAlta ?? null,
        OSAndes: a.obraSocial ?? null,
        localidadDom: a.localidadSinCP ?? null,
        tipoAltaBaja: a.tipoAltaBaja ?? null,
        nroDocumento: a.nroDocumento ?? null,
    }
}

const FILAS: { label: string; get: (d: any) => any }[] = [
    { label: 'Apellido y Nombre', get: (d) => d.apellidoNombre },
    { label: 'Email', get: (d) => d.mail },
    { label: 'Teléfono', get: (d) => d.celular },
    { label: 'Tipo Alta/Baja', get: (d) => d.tipoAltaBaja },
    { label: 'Plan', get: (d) => d.planAfiliado },
    { label: 'Provincia', get: (d) => d.provinciaDom },
    { label: 'Vía Clínica', get: (d) => d.viasClinicas },
    { label: 'CUIL Afiliado', get: (d) => d.cuilAfiliado ?? d.CUILAfiliado },
    { label: 'CUIL Titular', get: (d) => d.CUILTitular },
    { label: 'Id Titular', get: (d) => d.IdAfiliadoTitular },
    { label: 'Fecha Alta', get: (d) => d.mesAlta },
    { label: 'Obra Social', get: (d) => d.OSAndes },
    { label: 'Localidad', get: (d) => d.localidadDom },
    { label: 'DNI', get: (d) => d.nroDocumento ?? (d.CUILTitular ? String(d.CUILTitular).slice(2, -1) : null) },
]

type Props = {
    token: string
    chatId: string | null | undefined
    conversacionId: string | null | undefined
    onAuthExpired?: (resp: any) => boolean
}

const AfiliadoConversacionCard = ({ token, chatId, conversacionId, onAuthExpired }: Props) => {
    const [data, setData] = useState<AfiliadoConversacionResponse | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!token || !chatId || !conversacionId) { setData(null); return }
        const controller = new AbortController()
        setLoading(true)
        getAfiliadoConversacion(token, chatId, conversacionId, { signal: controller.signal })
            .then((resp: any) => {
                if (onAuthExpired?.(resp)) return
                setData(resp ?? null)
            })
            .catch(() => setData(null))
            .finally(() => setLoading(false))
        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, chatId, conversacionId])

    const panelData: any = useMemo(() => {
        if (!data?.afiliado) return {}
        return data.origen === 'ANDES' ? (mapAfiliadoAndes(data.afiliado) ?? {}) : data.afiliado
    }, [data])

    const filas = FILAS.map((f) => ({ label: f.label, valor: f.get(panelData) })).filter((f) => f.valor !== null && f.valor !== undefined && f.valor !== '')

    return (
        <div className='chat-info-panel-section'>
            <div className='chat-info-panel-section-title'>
                <span>Datos del Afiliado</span>
                {data?.origen === 'ANDES' && data.afiliado && <span className='chat-info-panel-origen chat-info-panel-origen--andes'>Andes · DNI {data.afiliadoDni ?? ''}</span>}
                {data?.origen === 'CELULAR' && data.afiliado && <span className='chat-info-panel-origen chat-info-panel-origen--celular'>Por celular</span>}
            </div>
            {loading && <span className='chat-info-empty'>Cargando...</span>}
            {!loading && data?.error && <div className='chat-info-panel-aviso chat-info-panel-aviso--error'>{data.error}</div>}
            {!loading && data?.aviso && <div className='chat-info-panel-aviso'>{data.aviso}</div>}
            {!loading && !data?.error && !data?.aviso && filas.length === 0 && <span className='chat-info-empty'>Sin datos para esta conversación</span>}
            <div className='chat-info-panel-rows'>
                {filas.map((f) => (
                    <div className='chat-info-panel-row' key={f.label}>
                        <span className='chat-info-panel-label'>{f.label}</span>
                        <span className='chat-info-panel-value'>{String(f.valor)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AfiliadoConversacionCard
