import { createSlice } from '@reduxjs/toolkit'
import { ActionState } from '../../interfaces/action.interface'

const initialState : ActionState = {
    modal: false,
    modalTag: false,
    modalTicket: false,
    modalUser: false,
    modalPlantilla: false,
    msg: '',
    alerta: false,
    newTag: null,
    dataUser: null,
    viewSide: false,
    modalTeca: false,
    ticketId: '',
    sessionExpired: false,
    chats: [],
    mentionUnreadCount: 0,
    mentionsRefreshNonce: 0,
    mentionsMode: false,
    selectedMentionChatIds: [],
    selectedBulkReadChatIds: []
}

const actionSlice = createSlice({
    name: 'action',
    initialState,
    reducers: {
        /* addMessage: (state, action) => {
            state.msg = action.payload
        }, */
        setNewTag: (state, action) => {
            state.newTag = action.payload;
        },
        throwAlert: (state, action) => {
            state.alerta = true
            state.msg = action.payload
        },
        openModal: (state) => {
            state.modal = true
        },
        closeModal: (state) => {
            state.modal = false
        },
        openModalTag: (state) => {
            state.modalTag = true
        },
        closeModalTag: (state) => {
            state.modalTag = false
        },
        setUserData: (state, action) => {
            state.dataUser = action.payload
        },
        setViewSide: (state, action) => {
            state.viewSide = action.payload
        },
        openModalTicket: (state) => {
            state.modalTicket = true
        },
        closeModalTicket: (state) => {
            state.modalTicket = false
        },
         openModalUser: (state) => {
            state.modalUser = true
        },
        closeModalUser: (state) => {
            state.modalUser = false
        },
        openModalTeca: (state,action) => {
            state.modalTeca = true
            state.ticketId = action.payload
        },
        closeModalTeca: (state) => {
            state.modalTeca = false
        },
        switchModalPlantilla: (state) => {
            state.modalPlantilla = !state.modalPlantilla
        },
        eraseDataUser: (state) => {
            state.dataUser = null
        },
        openSessionExpired: (state) => {
            state.sessionExpired = true
        },
        closeSessionExpired: (state) => {
            state.sessionExpired = false
        },
        setChats: (state, action) => {
            state.chats = action.payload
        },
        /**
         * Marcado local como leído (optimistic UI / sync post-backend).
         * - Resetea `unreadCount` si existe
         * - Marca `leido=true` en mensajes entrantes legacy si vienen en `mensajes`
         */
        markChatReadLocal: (state, action) => {
            const chatId = action.payload as string
            if (!chatId) return

            const chats = Array.isArray(state.chats) ? state.chats : []
            const idx = chats.findIndex((c: any) => c?.id === chatId)
            if (idx < 0) return

            const chat: any = chats[idx]
            chat.unreadCount = 0
            chat.manualUnread = false

            if (Array.isArray(chat.mensajes)) {
                chat.mensajes = chat.mensajes.map((m: any) => {
                    // solo entrantes
                    if (m?.msg_entrada && m?.leido === false) return { ...m, leido: true }
                    return m
                })
            }

            // forzamos reemplazo para asegurar re-render
            state.chats = [...chats]
        },
        /**
         * Marcado local como "no leído" (manualUnread) sin tocar mensajes.
         * Útil para UX: dejar un chat pendiente aunque no haya nuevos mensajes.
         */
        markChatUnreadLocal: (state, action) => {
            const chatId = action.payload as string
            if (!chatId) return

            const chats = Array.isArray(state.chats) ? state.chats : []
            const idx = chats.findIndex((c: any) => c?.id === chatId)
            if (idx < 0) return

            const chat: any = chats[idx]
            chat.manualUnread = true

            state.chats = [...chats]
        },
        setMentionUnreadCount: (state, action) => {
            state.mentionUnreadCount = action.payload
        },
        bumpMentionsRefreshNonce: (state) => {
            state.mentionsRefreshNonce = (state.mentionsRefreshNonce || 0) + 1
        },
        setMentionsMode: (state, action) => {
            state.mentionsMode = !!action.payload
        },
        toggleMentionChatSelection: (state, action) => {
            const chatId = action.payload as string
            if (!chatId) return
            const set = new Set(state.selectedMentionChatIds || [])
            if (set.has(chatId)) set.delete(chatId)
            else set.add(chatId)
            state.selectedMentionChatIds = Array.from(set)
        },
        clearMentionChatSelection: (state) => {
            state.selectedMentionChatIds = []
        },
        toggleBulkReadChatSelection: (state, action) => {
            const chatId = action.payload as string
            if (!chatId) return
            const set = new Set(state.selectedBulkReadChatIds || [])
            if (set.has(chatId)) set.delete(chatId)
            else set.add(chatId)
            state.selectedBulkReadChatIds = Array.from(set)
        },
        clearBulkReadChatSelection: (state) => {
            state.selectedBulkReadChatIds = []
        },
    }
})

export const {  
    openModal, 
    closeModal, 
    closeModalTag, 
    openModalTag, 
    throwAlert, 
    setNewTag, 
    setUserData, 
    setViewSide, 
    openModalTicket, 
    closeModalTicket,
    openModalUser,
    closeModalUser,
    openModalTeca,
    closeModalTeca,
    switchModalPlantilla,
    eraseDataUser,
    openSessionExpired,
    closeSessionExpired,
    setChats,
    markChatReadLocal,
    markChatUnreadLocal,
    setMentionUnreadCount,
    bumpMentionsRefreshNonce,
    setMentionsMode,
    toggleMentionChatSelection,
    clearMentionChatSelection,
    toggleBulkReadChatSelection,
    clearBulkReadChatSelection
} = actionSlice.actions
export default actionSlice.reducer

