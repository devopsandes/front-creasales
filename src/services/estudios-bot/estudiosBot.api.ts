// src/services/estudios-bot/estudiosBot.api.ts
import axios from "axios"
import { resolveClient } from "../apiClient"
import {
    CatDiagnostico, CatEfector, CatMotivo, CatPrestacion, CatPrestador, CatSolicitante,
    EstudioDetalle, EstudiosListaResponse, GuardarRevisionBody, MensajeChat, ResolverBody, ResumenChat,
} from "../../interfaces/estudios-bot.interface"

const client = resolveClient("bot")

const handle = async <T>(task: () => Promise<{ data: T }>): Promise<T> => {
    try {
        const { data } = await task()
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) return error.response.data as T
        throw error
    }
}

export interface ListarParams {
    page?: number
    limit?: number
    q?: string
    veredicto?: string
    revision?: 'pendiente' | 'completa' | ''
    incluirPruebas?: boolean
    incluirReanalisis?: boolean
    soloReales?: boolean
    estado?: string
}

export const listarEstudios = (params: ListarParams) =>
    handle<EstudiosListaResponse & { message?: string }>(() =>
        client.get('/estudios-bot', {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                ...(params.q ? { q: params.q } : {}),
                ...(params.veredicto ? { veredicto: params.veredicto } : {}),
                ...(params.revision ? { revision: params.revision } : {}),
                ...(params.incluirPruebas ? { incluirPruebas: 'true' } : {}),
                ...(params.incluirReanalisis ? { incluirReanalisis: 'true' } : {}),
                ...(params.soloReales ? { soloReales: 'true' } : {}),
                ...(params.estado ? { estado: params.estado } : {}),
            },
        }))

/** `trabajar`: en un pendiente, vuelve a tomar el pedido en Expendio antes de mostrarlo. */
export const obtenerEstudio = (id: string, clave?: string, trabajar = false) =>
    handle<EstudioDetalle & { message?: string }>(() =>
        client.get(`/estudios-bot/${id}`, { params: { ...(clave ? { clave } : {}), ...(trabajar ? { trabajar: 'true' } : {}) } }))

export const resolverEstudio = (id: string, body: ResolverBody) =>
    handle<EstudioDetalle & { message?: string | string[] }>(() =>
        client.post(`/estudios-bot/${id}/resolver`, body))

export const precioPrestacion = (idConvenio: string, idCodigo: string, idAfiliado: string, idProfesional: string) =>
    handle<{ importeConvenido?: number | null; coseguro?: number | null; alertaDuplicacion?: string | null; message?: string }>(() =>
        client.get('/estudios-bot/catalogos/prestaciones/precio', { params: { idConvenio, idCodigo, idAfiliado, idProfesional } }))

/** `n` (desde 1): cuál de las imágenes de un pedido con varias fotos. Sin `n`, la principal. */
export const obtenerImagenEstudio = (id: string, n?: number) =>
    handle<{ statusCode: number; url?: string; total?: number; message?: string }>(() =>
        client.get(`/estudios-bot/${id}/imagen`, { params: n && n > 1 ? { n } : {} }))

/** Chat con el afiliado de la solicitud (solo lectura, no toma la alarma). */
export const obtenerChatEstudio = (id: string) =>
    handle<{ statusCode: number; mensajes?: MensajeChat[]; resumen?: ResumenChat | null; message?: string }>(() =>
        client.get(`/estudios-bot/${id}/chat`))

/** La operadora le escribe al afiliado. Devuelve el chat actualizado. */
export const enviarChatEstudio = (id: string, texto: string) =>
    handle<{ statusCode: number; mensajes?: MensajeChat[]; resumen?: ResumenChat | null; message?: string | string[] }>(() =>
        client.post(`/estudios-bot/${id}/chat`, { texto }))

/** Varias fotos: guarda qué hacer con este pedido (codificar o rechazar) sin ejecutar nada. */
export const guardarDecisionEstudio = (id: string, body: ResolverBody) =>
    handle<EstudioDetalle & { message?: string | string[] }>(() =>
        client.post(`/estudios-bot/${id}/decision`, body))

/** Varias fotos: ejecuta las decisiones guardadas de toda la solicitud. Devuelve el detalle del pedido 1. */
export const confirmarGrupoEstudios = (grupoId: string) =>
    handle<EstudioDetalle & { message?: string | string[] }>(() =>
        client.post(`/estudios-bot/grupo/${grupoId}/confirmar`, null))

/** Varias fotos: la operadora pide analizar la foto `n` que el bot descartó. Devuelve el detalle del pedido nuevo. */
export const procesarImagenEstudio = (id: string, n: number) =>
    handle<EstudioDetalle & { message?: string | string[] }>(() =>
        client.post(`/estudios-bot/${id}/procesar-imagen`, null, { params: { n } }))

export const guardarRevision = (id: string, body: GuardarRevisionBody) =>
    handle<EstudioDetalle & { message?: string | string[] }>(() =>
        client.post(`/estudios-bot/${id}/revision`, body))

const items = <T>(path: string, params: Record<string, string | undefined>) =>
    handle<{ items?: T[] }>(() => client.get(path, { params })).then((r) => r.items ?? [])

export const buscarSolicitantes = (q: string) => items<CatSolicitante>('/estudios-bot/catalogos/solicitantes', { q })
export const buscarDiagnosticos = (q: string) => items<CatDiagnostico>('/estudios-bot/catalogos/diagnosticos', { q })
export const buscarEfectores = (idConvenio: string, q: string) => items<CatEfector>('/estudios-bot/catalogos/efectores', { idConvenio, q })
export const buscarPrestaciones = (idConvenio: string, idAfiliado: string, q: string) =>
    items<CatPrestacion>('/estudios-bot/catalogos/prestaciones', { idConvenio, idAfiliado, q })
export const buscarPrestadores = (q: string) => items<CatPrestador>('/estudios-bot/catalogos/prestadores', { q })
export const obtenerMotivosRechazo = () => items<CatMotivo>('/estudios-bot/catalogos/motivos-rechazo', {})

export const reanalizarEstudio = (id: string, modo: 'matching' | 'completo', clave: string) =>
    handle<EstudioDetalle & { message?: string | string[] }>(() =>
        client.post(`/estudios-bot/${id}/reanalizar`, null, { params: { modo, clave } }))

export const guardarComentarioFinal = (id: string, body: { opinionBot: string; comentario?: string }) =>
    handle<EstudioDetalle & { message?: string | string[] }>(() =>
        client.post(`/estudios-bot/${id}/comentario-final`, body))