// Marca de "recordar este navegador" (MFA). Vive aparte de la sesión:
// cerrar sesión no la borra, así no se vuelve a pedir el código.
const CLAVE = 'creasales_dispositivo_confiable'

export const obtenerDispositivoConfiable = (): string | undefined => {
    try { return localStorage.getItem(CLAVE) || undefined } catch { return undefined }
}

export const guardarDispositivoConfiable = (token: string) => {
    try { localStorage.setItem(CLAVE, token) } catch { /* sin almacenamiento */ }
}

export const borrarDispositivoConfiable = () => {
    try { localStorage.removeItem(CLAVE) } catch { /* sin almacenamiento */ }
}

/** Reemplazo de localStorage.clear() para logout y sesión vencida. */
export const limpiarSesion = () => {
    const dispositivo = obtenerDispositivoConfiable()
    localStorage.clear()
    if (dispositivo) guardarDispositivoConfiable(dispositivo)
}