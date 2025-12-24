import { Tag } from "../interfaces/common.interface"

const navEmpresa: Tag[] = [
    {
      id: 1,
      name: "Datos",
      path: "/dashboard/empresa"
    },
    {
      id: 2,
      name: "Form",
      path: "/dashboard/empresa/form"
    }
  ]

  const navAcciones: Tag[] = [
     {
      id: 1,
      name: "Acciones",
      path: "/dashboard/acciones"
    },
   
  ]

  const navEstados: Tag[] = [
    {
      id: 1,
      name: "Form",
      path: "/dashboard/estados"
    },
    {
      id: 2,
      name: "Datos",
      path: "/dashboard/estados/datos"
    }
  ]

  const navMeta: Tag[] = [
    {
      id: 1,
      name: "Form",
      path: "/dashboard/meta"
    },
    {
      id: 2,
      name: "Guía",
      path: "/dashboard/meta/datos"
    }
  ]


  const navModulos: Tag[] = [
    {
      id: 1,
      name: "Form",
      path: "/dashboard/modulos"
    },
    {
      id: 2,
      name: "Datos",
      path: "/dashboard/modulos/datos"
    }
  ]

  const navUsuarios: Tag[] = [
   /*  {
      id: 1,
      name: "Form",
      path: "/dashboard/usuarios"
    }, */
    {
      id: 1,
      name: "Usuarios",
      path: "/dashboard/usuarios"
    }
  ]

  const navCategorias: Tag[] = [
    {
      id: 1,
      name: "Form",
      path: "/dashboard/categorias"
    },
    {
      id: 2,
      name: "Datos",
      path: "/dashboard/modulos/datos"
    }
  ]

  const navTareas: Tag[] = [
    {
      id: 1,
      name: "Acciones",
      path: "/dashboard/tareas"
    },
    {
      id: 2,
      name: "Datos",
      path: "/dashboard/modulos/datos"
    }
  ]

  const navChats: Tag[] = [
    {
      id: 1,
      name: "Chats",
      path: "/dashboard/chats"
    },
   
  ]

  const navTickets: Tag[] = [
    {
      id: 1,
      name: "Tickets",
      path: "/dashboard/tickets"
    },
  ]

  const navClientes: Tag[] = [
    {
      id: 1,
      name: "Clientes",
      path: "/dashboard/clientes"
    },
  ]

  const navTags: Tag[] = [
    {
      id: 1,
      name: "Tags",
      path: "/dashboard/tags"
    },
  ]

  const navIntegraciones: Tag[] = [
    {
      id: 1,
      name: "Integraciones",
      path: "/dashboard/integraciones"
    },
  ]


export {
    navCategorias,
    navChats,
    navEmpresa,
    navEstados,
    navMeta,
    navModulos,
    navTareas,
    navUsuarios,
    navTickets,
    navTags,
    navAcciones,
    navClientes,
    navIntegraciones
}