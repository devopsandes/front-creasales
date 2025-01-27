

export const TIPOS_DOC = [
    {
        id: 1,
        nombre: 'DNI'
    },
    {
        id: 2,
        nombre: 'LE'
    },
    {
        id: 3,
        nombre: 'LC'
    },
    {
        id: 4,
        nombre: 'CI'
    }
]

export const ROLES  = [
    {
        id: 1,
        nombre: 'ADMIN'
    },
    {
        id: 2,
        nombre: 'SUPER'
    },
    {
        id: 3,
        nombre: 'USER'
    }
]
   

export const sectores = [
    { value: 'agricultura', label: 'Agricultura y Ganadería' },
    { value: 'industria', label: 'Industria y Manufactura' },
    { value: 'tecnologia', label: 'Tecnología e Innovación' },
    { value: 'comercio', label: 'Comercio y Retail' },
    { value: 'construccion', label: 'Construcción e Infraestructura' },
    { value: 'transporte', label: 'Transporte y Logística' },
    { value: 'educacion', label: 'Educación y Formación' },
    { value: 'salud', label: 'Salud y Medicina' },
    { value: 'gastronomia', label: 'Gastronomía y Hostelería' },
    { value: 'finanzas', label: 'Finanzas y Seguros' },
    { value: 'arte', label: 'Arte, Entretenimiento y Cultura' },
    { value: 'energia', label: 'Energía y Recursos Naturales' },
    { value: 'servicios', label: 'Servicios Profesionales' },
    { value: 'seguridad', label: 'Seguridad y Defensa' },
    { value: 'comunicacion', label: 'Comunicación y Medios' }
];

export const tamanos = [
    { value: 'micro', label: 'Microempresa (0-10 empleados)' },
    { value: 'pequena', label: 'Pequeña empresa (11-50 empleados)' },
    { value: 'mediana', label: 'Mediana empresa (51-250 empleados)' },
    { value: 'grande', label: 'Gran empresa (Más de 250 empleados)' }
];

export const STATES_USER = [
    {id: 1, nombre: 'EXCELENTE'},
    {id: 2, nombre: 'MUY BUENO'},
    {id: 3, nombre: 'BUENO'},
    {id: 4, nombre: 'REGULAR'},
    {id: 5, nombre: 'BAJO'},
    {id: 6, nombre: 'INSUFICIENTE'},
]

export const STATES_CLIENT = [
    {id: 1, nombre: 'NUEVO'},
    {id: 2, nombre: 'ACTIVO'},
    {id: 3, nombre: 'INACTIVO'},
    {id: 4, nombre: 'REACTIVADO'},
    {id: 5, nombre: 'BAJA'},
]

export const STATES_TICKETS = [
    {id: 1, nombre: 'EN PROCESO'},
    {id: 2, nombre: 'PENDIENTE'},
    {id: 3, nombre: 'RESUELTO'},
    {id: 4, nombre: 'CERRADO'},
    {id: 5, nombre: 'REABIERTO'},
]

export const REF_STATES = [
    {id: 1, nombre: 'USER'},
    {id: 2, nombre: 'CLIENTE'},
    {id: 3, nombre: 'TICKET'},
]
