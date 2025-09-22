import { createSlice } from '@reduxjs/toolkit'
import { ActionState } from '../../interfaces/action.interface'

const initialState : ActionState = {
    modal: false,
    modalTag: false,
    modalTicket: false,
    modalUser: false,
    msg: '',
    alerta: false,
    newTag: null, // Initialize newTag with an empty Tag object
    dataUser: null,
    viewSide: false,
    modalTeca: false,
    ticketId: ''
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
    closeModalTeca
} = actionSlice.actions
export default actionSlice.reducer

