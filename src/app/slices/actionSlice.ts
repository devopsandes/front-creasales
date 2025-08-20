import { createSlice } from '@reduxjs/toolkit'
import { ActionState } from '../../interfaces/action.interface'

const initialState : ActionState = {
    modal: false,
    modalTag: false,
    modalTicket: false,
    msg: '',
    alerta: false,
    newTag: null, // Initialize newTag with an empty Tag object
    dataUser: null,
    viewSide: false
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
        }
    }
})

export const {  openModal, closeModal, closeModalTag, openModalTag, throwAlert, setNewTag, setUserData, setViewSide, openModalTicket, closeModalTicket } = actionSlice.actions
export default actionSlice.reducer

