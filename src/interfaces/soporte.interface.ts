export type EstadoSoporte = 'abierto' | 'en-curso' | 'esperando-cliente' | 'resuelto' | 'cerrado'
export type GravedadSoporte = 'critica' | 'alta' | 'media' | 'baja'

export const CATEGORIAS_SOPORTE: Record<string, string> = {
    whatsapp: 'WhatsApp',
    ios: 'App iOS',
    android: 'App Android',
    web: 'Chat web',
    bot: 'Bot (flujo y respuestas)',
    tickets_zoho: 'Tickets y Zoho',
    estudios_bot: 'Estudios (bot)',
    acceso: 'Acceso y usuarios',
    otro: 'Otro',
}

export const GRAVEDADES_SOPORTE: { valor: GravedadSoporte; label: string; descripcion: string; cls: string }[] = [
    { valor: 'critica', label: 'Crítica', descripcion: 'El sistema no funciona', cls: 'eb-badge-rojo' },
    { valor: 'alta', label: 'Alta', descripcion: 'Una función importante está afectada', cls: 'eb-badge-amarillo' },
    { valor: 'media', label: 'Media', descripcion: 'Funciona, pero con dificultades', cls: 'sp-badge-azul' },
    { valor: 'baja', label: 'Baja', descripcion: 'Consulta o mejora', cls: 'sp-badge-gris' },
]

export const ESTADOS_SOPORTE: Record<EstadoSoporte, { label: string; cls: string; ayuda: string }> = {
    'abierto': { label: 'Abierto', cls: 'eb-badge-violeta', ayuda: 'Llegó a soporte y todavía nadie lo empezó' },
    'en-curso': { label: 'En curso', cls: 'sp-badge-azul', ayuda: 'Soporte lo está trabajando' },
    'esperando-cliente': { label: 'Esperan tu respuesta', cls: 'eb-badge-amarillo', ayuda: 'Soporte necesita algo de vos' },
    'resuelto': { label: 'Resuelto', cls: 'eb-badge-verde', ayuda: 'Soporte lo dio por resuelto' },
    'cerrado': { label: 'Cerrado', cls: 'sp-badge-gris', ayuda: 'Lo cerraste vos' },
}

export interface TicketSoporte {
    id: string
    numero: string
    referenciaExterna: string | null
    titulo: string | null
    categoria: string | null
    categoriaNombre: string | null
    gravedad: GravedadSoporte | null
    estado: EstadoSoporte
    descripcion: string | null
    pantalla: string | null
    usuarioId: string | null
    autorNombre: string | null
    autorEmail: string | null
    closedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface ComentarioSoporte {
    id: string
    ticketId: string
    autorTipo: 'usuario' | 'soporte'
    autor: string | null
    texto: string
    origen: 'local' | 'mesa'
    fecha: string
}

export interface AdjuntoSoporte {
    id: string
    nombre: string
    tipo: string | null
    tamano: number
    subidoPor: string | null
    createdAt: string
    url: string | null
}

export interface EnvioSoporte {
    id: string
    evento: string
    estado: 'pendiente' | 'procesando' | 'enviado' | 'fallido' | 'ignorado'
    intentos: number
    ultimoStatus: number | null
    proximoIntento: string
    createdAt: string
}

export interface TicketSoporteDetalle extends TicketSoporte {
    comentarios: ComentarioSoporte[]
    adjuntos: AdjuntoSoporte[]
    envios?: EnvioSoporte[]
}

export interface RespuestaBase {
    statusCode?: number
    message?: string | string[]
    error?: string
}

export interface ListaTicketsSoporteResponse extends RespuestaBase {
    page: number
    limit: number
    total: number
    tickets: TicketSoporte[]
}

export interface TicketSoporteResponse extends RespuestaBase {
    ticket: TicketSoporteDetalle
}

export interface CrearTicketSoporteDatos {
    titulo: string
    categoria: string
    gravedad: GravedadSoporte
    descripcion: string
    pantalla?: string
}