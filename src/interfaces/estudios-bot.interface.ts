// src/interfaces/estudios-bot.interface.ts

export type Veredicto = 'CODIFICAR' | 'RECHAZAR' | 'DERIVAR'

export interface Ref {
  id: string | null
  nombre: string | null
  matricula?: string | null
  codigo?: string | null
  texto?: string | null
}

export interface PrestacionElegida {
  idCodigo: string | null
  codigo: string | null
  descripcion: string | null
  cantidad: number
  texto?: string
  codigoEscrito?: string | null
  metodo?: string
  score?: number
  segundoScore?: number
}

export interface EstudioListaItem {
  id: string
  created_at: string
  id_orden: string
  dni: string | null
  afiliado_nombre: string | null
  nro_afiliado: string | null
  provincia: string | null
  es_prueba: boolean
  bot_prestador_nombre: string | null
  especialidad_bot: string | null
  bot_veredicto: Veredicto
  bot_motivo: string | null
  bot_confianza: string | null
  op_veredicto: Veredicto | null
  op_fecha: string | null
  op_usuario_nombre: string | null
  error: string | null
}

export interface EstudiosListaResponse {
  statusCode: number
  page: number
  limit: number
  total: number
  items: EstudioListaItem[]
}

export interface RevisionOperadora {
  veredicto: Veredicto
  motivo: { id: string | null; texto: string | null }
  comentario: string | null
  prestador: Ref
  solicitante: Ref
  diagnostico: Ref
  efector: Ref
  prestaciones: PrestacionElegida[]
  usuario: { id: string | null; nombre: string | null }
  fecha: string
  vioBotAntes: boolean | null
}

export interface DecisionBot {
  veredicto: Veredicto
  motivo: { id: string | null; texto: string | null }
  detalle: string | null
  confianza: string | null
  prestador: Ref
  solicitante: Ref
  diagnostico: Ref
  efector: Ref
  prestaciones: PrestacionElegida[]
  matchDetalle: Record<string, unknown> | null
  lectura: Record<string, unknown> | null
  respuestaModelo: Record<string, unknown> | null
  modelo: string | null
  duracionMs: number | null
}

export interface EstudioDetalle {
  statusCode: number
  id: string
  created_at: string
  id_orden: string
  id_afiliado: string | null
  dni: string | null
  afiliado_nombre: string | null
  nro_afiliado: string | null
  provincia: string | null
  es_prueba: boolean
  especialidad_bot: string | null
  prestador: Ref
  error: string | null
  operadora: RevisionOperadora | null
  bot: DecisionBot | null
  botVisible: boolean
}

export interface GuardarRevisionBody {
  veredicto: Veredicto
  motivo?: { id?: string | null; texto?: string | null }
  comentario?: string
  prestador?: { id?: string | null; nombre?: string | null }
  solicitante?: { id?: string | null; nombre?: string | null; matricula?: string | null }
  diagnostico?: { id?: string | null; nombre?: string | null; codigo?: string | null }
  efector?: { id?: string | null; nombre?: string | null }
  prestaciones?: { idCodigo: string | null; codigo: string | null; descripcion: string | null; cantidad: number }[]
  vioBotAntes?: boolean
}

// Catálogos (tal como los devuelve Andes)
export interface CatSolicitante { idProfesional: string; nombre: string; matricula: string }
export interface CatDiagnostico { idDiagnostico: string; descDiagnostico: string; codigoDiagnostico: string }
export interface CatEfector { idProfesional: string; nombreProfesional: string; matricula: string }
export interface CatPrestacion { idCodigo: string; codigo: string; descCodigo: string; esPorPresupuesto?: string }
export interface CatPrestador { idConvenio: string; nombreConvenio: string }
export interface CatMotivo { idMensaje: string; tema: string; texto: string }