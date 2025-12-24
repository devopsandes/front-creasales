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
<<<<<<< HEAD
    newTag: null, // Initialize newTag with an empty Tag object
=======
    newTag: null,
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
    dataUser: null,
    viewSide: false,
    modalTeca: false,
    ticketId: '',
<<<<<<< HEAD
    sessionExpired: false
=======
    sessionExpired: false,
    chats: []
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
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
<<<<<<< HEAD
=======
        },
        setChats: (state, action) => {
            state.chats = action.payload
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
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
<<<<<<< HEAD
    closeSessionExpired
=======
    closeSessionExpired,
    setChats
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
} = actionSlice.actions
export default actionSlice.reducer

