import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { AuthState, User } from "../../interfaces/auth.interface";
import { Empresa } from "../../interfaces/empresa.interface";

const initialState: AuthState = {
    user: null, // Guardará la información del usuario autenticado
    isAuthenticated: false, // Indica si el usuario está autenticado
    isLoading: false, // Maneja el estado de carga
    message: '', // Almacena mensajes de error o satisfactorios
    empresa: null, // Almacena la información de la empresa del usuario
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
        },
        setEmpresa:(state, action: PayloadAction<Empresa | null>) => {
            state.empresa = action.payload
        },
        setUser:(state, action: PayloadAction<User | null>) => {
            state.user = action.payload
        }
    }
})

export const { addMessage, accessGranted, setEmpresa, setUser } = authSlice.actions
export default authSlice.reducer