// src/interfaces/estudios-bot.interface.ts

/** Lo que Expendio muestra del afiliado (pestañas General y Vías clínicas), leído al tomar la orden. */
export interface AfiliadoExpendio {
    afiliado: string
    numAfiliado: string
    fecNac: string
    estadoCivil: string
    vigOpcion: string
    estadoAfiliacion: string
    parentesco: string
    edad: string
    nacionalidad: string
    periodoBaja: string
    planPrestacional: string
    obraSocial: string
    prestador: string
    /** "#FFFFFF" = sin color. */
    colorFondo: string
    viasClinicas: string[]
    imagenes: string[]
    leidoEn: string
}

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
    cobertura?: number
    alcanza?: boolean
    importeConvenido?: number | null
    coseguro?: number | null
    /** Frase de Andes si ya se registró para el afiliado en los últimos 60 días. */
    alertaDuplicacion?: string | null
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
    reanalisis_de?: string | null
    modo_reanalisis?: string | null
    modo_sombra?: boolean
    accion?: string | null
    estado?: 'RECIBIDO' | 'PENDIENTE' | 'RESUELTO' | 'SOMBRA'
    resuelto_por?: 'BOT' | 'OPERADORA' | 'EXPENDIO' | null
    campos_modificados?: string[] | null
    /** WSP-CREASALES (chat), APPANDROID o APPIOS (pantalla de estudios de la app). */
    origen?: string
    cantidadImagenes?: number
    /** Solicitud de la app con varias fotos: cuántos pedidos médicos armó el bot. */
    cantidadPedidos?: number | null
}

/** Qué es cada foto de una solicitud con varias imágenes, según el bot. */
export type RolFoto = 'PEDIDO' | 'CONTINUACION' | 'DUPLICADA' | 'CERTIFICADO' | 'NO_PEDIDO'
export interface MultiFoto {
    n: number
    rol: RolFoto
    /** CONTINUACION o DUPLICADA: de qué foto. */
    de: number | null
    motivo: string | null
    /** Número de pedido al que pertenece, o null si se descartó. */
    pedido: number | null
    /** Fila (estudio) del pedido al que pertenece, o null si se descartó. */
    analisisId: string | null
    error: string | null
    procesadaPor: string | null
    /** Lo que el bot leyó en una foto descartada. */
    lectura: Record<string, unknown> | null
}
export interface MultiInfo {
    grupo: string | null
    /** Qué pedido es este estudio (desde 1). */
    pedido: number
    /** Cuántos pedidos tiene la solicitud. */
    pedidos: number | null
    /** Fotos (desde 1) que forman este pedido. */
    imagenes: number[]
    rol: 'PEDIDO' | 'CERTIFICADO'
    total: number
    procesadaPor: string | null
    fotos: MultiFoto[]
    /** Etapa 2: qué decidió la operadora en cada pedido del grupo. */
    decisiones: DecisionPedido[]
    /** Todos los pedidos pendientes tienen decisión guardada: se puede confirmar. */
    confirmable: boolean
    /** Si está apagado, los rechazados de un grupo mixto no reciben aviso en la app. */
    mensajesParciales: boolean
}

export interface DecisionPedido {
    pedido: number
    analisisId: string
    imagenes: number[]
    estado?: 'RECIBIDO' | 'PENDIENTE' | 'RESUELTO' | 'SOMBRA'
    accion?: string | null
    resueltoPor?: string | null
    botVeredicto: Veredicto
    botMotivo: string | null
    decision: {
        accion: Veredicto | null
        motivoTexto: string | null
        textoAfiliado: string | null
        prestador: string | null
        prestaciones: { descripcion: string | null; codigo: string | null; cantidad: number; importeConvenido: number | null }[]
        total: string | null
        usuario: string | null
        guardadaEn: string | null
    } | null
    /** Rechazo parcial: si el aviso al afiliado salió o por qué no. */
    mensaje: { texto: string; enviado: boolean; motivo?: string; error?: string } | null
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
    opinionBot: 'BIEN' | 'MAL' | 'AMBAS_VALIDAS' | null
    comentarioFinal: string | null
    comentarioFinalFecha: string | null
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
    modoSombra?: boolean
    accion?: string | null
    ejecucion?: Record<string, any> | null
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
    afiliadoCategoria?: string | null
    afiliadoExpendio?: AfiliadoExpendio | null
    botTope?: string | null
    botTotal?: string | null
    opTotal?: string | null
    prestador: Ref
    error: string | null
    reanalisis_de?: string | null
    modo_reanalisis?: string | null
    operadora: RevisionOperadora | null
    bot: DecisionBot | null
    botVisible: boolean
    estado?: 'RECIBIDO' | 'PENDIENTE' | 'RESUELTO' | 'SOMBRA'
    resueltoPor?: 'BOT' | 'OPERADORA' | 'EXPENDIO' | null
    /** Lo que terminó pasando con el pedido, lo haya hecho el bot, la operadora o Expendio. */
    accion?: string | null
    camposModificados?: string[]
    /** Al abrir un pendiente: si se pudo volver a tomar en Expendio. */
    bloqueo?: { tomada: boolean; estado?: string; mensaje: string } | null
    /** Si se resolvió desde Expendio: qué dijo Andes (quién y cuándo). */
    expendio?: { estado: string; mensaje: string; visto: string } | null
    /** WSP-CREASALES (chat), APPANDROID o APPIOS (pantalla de estudios de la app). */
    origen?: string
    /** Todas las imágenes del pedido (la principal primero). Más de una solo en pedidos de la app. */
    imagenes?: string[]
    /** Solicitud de la app con varias fotos: qué foto es qué y a qué pedido lleva cada una. */
    multi?: MultiInfo | null
}

export interface ResolverBody extends GuardarRevisionBody {
    accion: Veredicto
    /** Rechazo: comentario para el afiliado, editado a partir de la plantilla. */
    textoAfiliado?: string
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