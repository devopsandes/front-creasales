export interface SpecialDayMessage {
    id: string
    fecha: string        // 'YYYY-MM-DD'
    horaDesde: string     // 'HH:mm:ss'
    horaHasta: string     // 'HH:mm:ss'
    mensaje: string
    activo: boolean
    createdAt: string
    updatedAt: string
}