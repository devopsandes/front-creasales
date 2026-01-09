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
    selectedMentionChatIds: []
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
        }
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
    setMentionUnreadCount,
    bumpMentionsRefreshNonce,
    setMentionsMode,
    toggleMentionChatSelection,
    clearMentionChatSelection
} = actionSlice.actions
export default actionSlice.reducer

