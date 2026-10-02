import { resolveClient } from '../apiClient'

export const obtenerAlertaCuentaWhatsapp = async () => {
    const { data } = await resolveClient('whatsapp').get('/meta/alerta-cuenta')
    return { alerta: data?.alerta ?? null }
}