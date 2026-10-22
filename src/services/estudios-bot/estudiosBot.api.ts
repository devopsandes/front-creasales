// src/services/estudios-bot/estudiosBot.api.ts
import axios from "axios"
import { resolveClient } from "../apiClient"
import {
    CatDiagnostico, CatEfector, CatMotivo, CatPrestacion, CatPrestador, CatSolicitante,
    EstudioDetalle, EstudiosListaResponse, GuardarRevisionBody, ResolverBody,
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
    handle<{ importeConvenido?: number | null; coseguro?: number | null; message?: string }>(() =>
        client.get('/estudios-bot/catalogos/prestaciones/precio', { params: { idConvenio, idCodigo, idAfiliado, idProfesional } }))

export const obtenerImagenEstudio = (id: string) =>
    handle<{ statusCode: number; url?: string; message?: string }>(() =>
        client.get(`/estudios-bot/${id}/imagen`))

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