import { createSlice } from "@reduxjs/toolkit"
import { AuthState } from "../../interfaces/auth.interface";

const initialState: AuthState = {
    user: null, // Guardará la información del usuario autenticado
    isAuthenticated: false, // Indica si el usuario está autenticado
    isLoading: false, // Maneja el estado de carga
    message: '', // Almacena mensajes de error o satisfactorios
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            state.message = action.payload
        },
        accessGranted: (state) => {
            state.isAuthenticated = true
        }
    }
})

export const { addMessage, accessGranted } = authSlice.actions
export default authSlice.reducer