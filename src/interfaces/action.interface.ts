
import { ChatState } from './chats.interface';
import { Usuario } from './auth.interface.ts'

export interface ActionState  {
   modalEditUser: boolean;
   editingUser: Usuario | null;
   modal: boolean;
   modalTag: boolean;
   modalTicket: boolean;
   modalUser: boolean;
   modalTeca: boolean;
   modalPlantilla: boolean;
   msg: string;
   alerta: boolean;
   newTag: string | null;
   dataUser:  DataUser | null;
   viewSide: boolean;
   ticketId: string;
   sessionExpired: boolean;
   chats: ChatState[];
   mentionUnreadCount: number;
   mentionsRefreshNonce: number;
   mentionsMode: boolean;
   selectedMentionChatIds: string[];
   /**
    * Selección "bulk" para marcar chats como leídos (fuera de Menciones).
    * No debe interferir con `selectedMentionChatIds`.
    */
   selectedBulkReadChatIds: string[];

   /**
    * Cache/estado de la vista de listado de chats (SPA-only).
    * Permite volver a /dashboard/chats sin recargar desde cero.
    */
   chatListQueryKey?: string;
   chatListPage?: number;
   chatListHasMore?: boolean;
   chatListUpdatedAt?: number;
   chatListTab?: string;
   chatListSearchText?: string;
   chatListSelectedOperator?: string;
   chatListSelectedTag?: string;
   chatListOrdenFecha?: 'desc' | 'asc';
   chatListScrollTop?: number;
   chatListFilters?: {
      q?: string;
      operatorId?: string;
      assignment?: string;
      tagId?: string;
      archived?: string | number | boolean;
   };
};

export interface DataUser {
   id:                 number;
   CUILAfiliado:       number;
   CUILTitular:        number;
   apellnombAfilado:   string;
   nroAfiliado:        string;
   parentesco:         string;
   sexo:               string;
   edad:               number;
   fecNac:             string;
   tipoEstado:         string;
   estado:             string;
   viasClinicas:       string;
   mesAlta:            string;
   mesBaja:            string;
   GF:                 number;
   planAfiliado:       string;
   subplan:            string;
   categoria:          string;
   catAfiliado:        string;
   tipoConsumidor:     string;
   OSAndes:            string;
   Empresas:           string;
   CUIT:               string;
   telefonoEmpresa:    string;
   emailEmpresa:       string;
   provinciaDom:       string;
   localidadDom:       string;
   direccion:          string;
   celular:            string;
   mail:               string;
   tarjeta:            string;
   vencimientoTarjeta: string;
   tipoTarjeta:        string;
   lotes:              string;
   formaPago:          string;
   titularTarjeta:     string;
   tipoDeudor:         null;
   tipoDeudorEmpresa:  null;
   cargaABM:           null;
   unifica:            string;
   ApEstimado:         number;
   IdAfiliado:         string;
   IdAfiliadoTitular:  string;
   idContrato:         number;
   createdAt:          Date;
   updatedAt:          Date;
}
